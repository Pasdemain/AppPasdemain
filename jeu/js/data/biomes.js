/* ============================================================
   biomes.js — secteurs de 50 vagues

   Chaque biome a sa palette, son décor, son bestiaire et ses cinq
   boss. Vaincre le boss de la 50ᵉ vague d'un secteur débloque le
   suivant, qu'on peut alors choisir comme point de départ.
   Au-delà du dernier secteur, le cycle reprend au palier supérieur.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF;

  const WAVES_PER_BIOME = NF.WAVES_PER_BIOME = 25;
  /* un boss toutes les 5 vagues : 5 boss par secteur */
  const WAVES_PER_BOSS = NF.WAVES_PER_BOSS = 5;

  const BIOMES = NF.BIOMES = [
    {
      id: 'grille',
      name: 'LA GRILLE',
      tagline: 'Secteur d\'entraînement — réseau de défense automatisé',
      icon: '▦',
      accent: '#3ef2ff',
      accent2: '#8b5cff',
      bg: '#05060f',
      grid: 'rgba(62,242,255,.07)',
      border: 'rgba(62,242,255,.35)',
      decor: 'grid',
      hpMul: 1, dmgMul: 1, speedMul: 1,
      eruptions: 0,
      bosses: ['prisme', 'vortex', 'hydre', 'bastion', 'architecte']
    },
    {
      id: 'faille',
      name: 'LA FAILLE',
      tagline: 'Le réseau s\'est déchiré — ici les machines ont muté',
      icon: '⟁',
      accent: '#ff3ea5',
      accent2: '#ff6b4d',
      bg: '#0b0413',
      grid: 'rgba(255,62,165,.06)',
      border: 'rgba(255,62,165,.4)',
      decor: 'rift',
      hpMul: 1.2, dmgMul: 1.1, speedMul: 1.06,
      eruptions: 11,                 // secondes entre deux éruptions du sol
      bosses: ['chimere', 'oracle', 'ruche', 'paradoxe', 'abysse']
    },
    {
      id: 'noyau',
      name: 'LE NOYAU',
      tagline: 'Le cœur en fusion du protocole — il te teste autrement',
      icon: '⬡',
      accent: '#ffd23e',
      accent2: '#ff6b4d',
      bg: '#0d0803',
      grid: 'rgba(255,210,62,.06)',
      border: 'rgba(255,210,62,.45)',
      decor: 'core',
      hpMul: 1.15, dmgMul: 1.05, speedMul: 1.1,
      eruptions: 8,
      bosses: ['creuset', 'orbitale', 'conduit', 'resonance', 'coeur']
    }
  ];

  NF.biomeById = id => BIOMES.find(b => b.id === id);

  /** Index de biome et palier pour une vague donnée */
  NF.biomeInfo = function (wave) {
    const n = Math.max(0, Math.floor((wave - 1) / WAVES_PER_BIOME));
    const index = n % BIOMES.length;
    return {
      index,
      tier: Math.floor(n / BIOMES.length),
      biome: BIOMES[index],
      /** vague relative au secteur, de 1 à 25 */
      local: ((wave - 1) % WAVES_PER_BIOME) + 1
    };
  };

  /** Première vague d'un secteur (index 0 → 1, index 1 → 26…) */
  NF.biomeFirstWave = index => index * WAVES_PER_BIOME + 1;

  /** Le boss de cette vague, s'il y en a un */
  NF.bossForWave = function (wave) {
    const info = NF.biomeInfo(wave);
    if (info.local % WAVES_PER_BOSS !== 0) return null;
    return {
      id: info.biome.bosses[(info.local / WAVES_PER_BOSS) - 1],
      tier: info.tier,
      biome: info.biome
    };
  };

  /** Nom affiché d'un secteur, palier compris : « LA GRILLE Mk II » */
  NF.biomeLabel = function (index) {
    const b = BIOMES[index % BIOMES.length];
    const tier = Math.floor(index / BIOMES.length);
    return b.name + (tier > 0 ? ' Mk ' + NF.romanize(tier + 1) : '');
  };

  /** Le boss final d'un secteur ferme le secteur et ouvre le suivant */
  NF.isBiomeFinale = wave => NF.biomeInfo(wave).local === WAVES_PER_BIOME;

})(window);
