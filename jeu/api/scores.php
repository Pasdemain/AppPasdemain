<?php
/* ============================================================
   scores.php — classement de Protocole Néon

   À déposer dans jeu/api/ sur un hébergement PHP. Aucune base de
   données : les scores tiennent dans un fichier JSON à côté.
   Le jeu détecte ce fichier tout seul ; s'il est absent, il bascule
   sur un classement local à l'appareil.

   Routes
     GET  ?ping=1        → {"ok":true}
     GET  ?top=50        → {"ok":true,"scores":[…]}
     POST (JSON)         → {"ok":true,"rank":12}

   Limites assumées : un score est envoyé par le navigateur, donc un
   joueur déterminé peut en fabriquer un faux. Les contrôles ci-dessous
   arrêtent les envois absurdes et le spam, pas une triche motivée.
   ============================================================ */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const STORE      = __DIR__ . '/scores.json';
const MAX_KEEP   = 300;   // scores conservés dans le fichier
const MAX_RETURN = 100;   // scores renvoyés au maximum
const POST_DELAY = 5;     // secondes minimum entre deux envois d'une même IP

/* ---------- Bornes de validité d'une partie ---------- */
const LIMITS = [
    'wave'  => [1, 999],
    'time'  => [0, 86400],
    'kills' => [0, 2000000],
    'level' => [1, 999],
];

function out(array $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Lit le fichier de scores (verrou partagé) */
function readStore(): array
{
    if (!is_file(STORE)) {
        return ['scores' => [], 'ips' => []];
    }
    $fh = @fopen(STORE, 'r');
    if (!$fh) {
        return ['scores' => [], 'ips' => []];
    }
    @flock($fh, LOCK_SH);
    $raw = stream_get_contents($fh);
    @flock($fh, LOCK_UN);
    fclose($fh);

    $data = json_decode((string) $raw, true);
    if (!is_array($data)) {
        $data = [];
    }
    $data['scores'] = isset($data['scores']) && is_array($data['scores']) ? $data['scores'] : [];
    $data['ips']    = isset($data['ips']) && is_array($data['ips']) ? $data['ips'] : [];
    return $data;
}

/** Écrit le fichier de scores (verrou exclusif, écriture atomique) */
function writeStore(array $data): bool
{
    $tmp = STORE . '.tmp';
    $fh  = @fopen($tmp, 'w');
    if (!$fh) {
        return false;
    }
    @flock($fh, LOCK_EX);
    fwrite($fh, json_encode($data, JSON_UNESCAPED_UNICODE));
    fflush($fh);
    @flock($fh, LOCK_UN);
    fclose($fh);
    return @rename($tmp, STORE);
}

/** Vague décroissante, puis temps croissant */
function cmpScore(array $a, array $b): int
{
    if ($a['wave'] !== $b['wave']) {
        return $b['wave'] <=> $a['wave'];
    }
    return $a['time'] <=> $b['time'];
}

/** Pseudo sûr à afficher : pas de balise, 16 caractères maximum */
function cleanPseudo(string $v): string
{
    $v = preg_replace('/[<>&"\'\\\\\/]/u', '', $v) ?? '';
    $v = preg_replace('/\s+/u', ' ', $v) ?? '';
    $v = trim($v);
    return mb_substr($v, 0, 16);
}

function clientIp(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? 'inconnue');
}

/* ============================================================
   GET
   ============================================================ */
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    if (isset($_GET['ping'])) {
        out(['ok' => true, 'version' => 1]);
    }

    $limit  = (int) ($_GET['top'] ?? 50);
    $limit  = max(1, min(MAX_RETURN, $limit));
    $store  = readStore();
    $scores = $store['scores'];
    usort($scores, 'cmpScore');

    $rows = [];
    foreach (array_slice($scores, 0, $limit) as $s) {
        $rows[] = [
            'id'     => $s['id'],
            'pseudo' => $s['pseudo'],
            'wave'   => $s['wave'],
            'time'   => $s['time'],
            'kills'  => $s['kills'],
            'level'  => $s['level'],
            'ts'     => $s['ts'],
        ];
    }
    out(['ok' => true, 'count' => count($scores), 'scores' => $rows]);
}

/* ============================================================
   POST — enregistrement d'une partie
   ============================================================ */
if ($method !== 'POST') {
    out(['ok' => false, 'error' => 'méthode non autorisée'], 405);
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 2000) {
    out(['ok' => false, 'error' => 'requête invalide'], 400);
}

$in = json_decode($raw, true);
if (!is_array($in)) {
    out(['ok' => false, 'error' => 'JSON invalide'], 400);
}

$pseudo = cleanPseudo((string) ($in['pseudo'] ?? ''));
$id     = preg_replace('/[^A-Za-z0-9\-]/', '', (string) ($in['id'] ?? ''));
$id     = substr((string) $id, 0, 40);

if (mb_strlen($pseudo) < 2 || $id === '') {
    out(['ok' => false, 'error' => 'pseudo ou identifiant manquant'], 400);
}

$entry = ['id' => $id, 'pseudo' => $pseudo, 'ts' => time()];
foreach (LIMITS as $field => [$min, $max]) {
    $v = $in[$field] ?? null;
    if (!is_numeric($v)) {
        out(['ok' => false, 'error' => "champ $field manquant"], 400);
    }
    $v = (int) $v;
    if ($v < $min || $v > $max) {
        out(['ok' => false, 'error' => "champ $field hors limites"], 400);
    }
    $entry[$field] = $v;
}

/* cohérence grossière : une vague élevée demande un minimum de temps */
if ($entry['time'] < $entry['wave'] * 3) {
    out(['ok' => false, 'error' => 'partie incohérente'], 400);
}

$store = readStore();

/* anti-spam par IP */
$ip  = clientIp();
$now = time();
if (isset($store['ips'][$ip]) && ($now - (int) $store['ips'][$ip]) < POST_DELAY) {
    out(['ok' => false, 'error' => 'trop de requêtes'], 429);
}
$store['ips'][$ip] = $now;
if (count($store['ips']) > 500) {                 // purge des entrées anciennes
    $store['ips'] = array_filter($store['ips'], fn($t) => ($now - (int) $t) < 3600);
}

/* un seul score par joueur : on garde le meilleur */
$replaced = false;
foreach ($store['scores'] as $i => $s) {
    if (($s['id'] ?? '') === $id) {
        if (cmpScore($entry, $s) < 0) {
            $store['scores'][$i] = $entry;
        } else {
            $store['scores'][$i]['pseudo'] = $pseudo;   // pseudo à jour
        }
        $replaced = true;
        break;
    }
}
if (!$replaced) {
    $store['scores'][] = $entry;
}

usort($store['scores'], 'cmpScore');
if (count($store['scores']) > MAX_KEEP) {
    $store['scores'] = array_slice($store['scores'], 0, MAX_KEEP);
}

if (!writeStore($store)) {
    out(['ok' => false, 'error' => 'écriture impossible'], 500);
}

$rank = 0;
foreach ($store['scores'] as $i => $s) {
    if (($s['id'] ?? '') === $id) {
        $rank = $i + 1;
        break;
    }
}

out(['ok' => true, 'rank' => $rank, 'count' => count($store['scores'])]);
