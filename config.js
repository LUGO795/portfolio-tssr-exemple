/* ================================================================
   config.js — Configuration Formspree via modal
   ──────────────────────────────────────────────────────────────
   INSTALLATION : ajouter UNE seule ligne dans le <head> de index.html
   (après les <link> Bootstrap / FontAwesome, avant </head>) :

       <script src="config.js"></script>

   UTILISATION (stagiaire) :
   • La modal s'ouvre automatiquement à la première visite
   • Cliquer sur l'onglet "Formspree" dans la navbar à tout moment
   • Raccourci clavier : Ctrl + Shift + F
   ================================================================ */

/* ÉPISODE 11 : on remplace le squelette de l'épisode 01 par le vrai contenu. Toujours une fonction auto-exécutée (IIFE) : rien de ce qu'on déclare ici ne fuit dans le reste de la page. */
(function () {
  /* Le mode strict : JavaScript signalera nos erreurs au lieu de les ignorer. */
  'use strict';

  /* ────────────────────────────────────────────────────────────
     CONSTANTES
  ──────────────────────────────────────────────────────────── */
  /* La clé sous laquelle on range l'identifiant Formspree dans le localStorage du navigateur. */
  var STORAGE_KEY  = '_formspree_key';
  /* L'identifiant de la fenêtre modale qu'on va créer. */
  var MODAL_ID     = 'fs-modal';
  /* L'identifiant du bouton « Formspree » qu'on va ajouter dans la navbar. */
  var BTN_ID       = 'fs-config-btn';
  /* L'identifiant du petit conteneur de ce bouton. */
  var NAV_WRAP_ID  = 'fs-nav-wrap';
  /* L'identifiant de la balise <style> qu'on va injecter. */
  var STYLES_ID    = 'fs-styles';
  /* Un minuteur, vide au départ, pour l'enregistrement automatique. */
  var _autoTimer   = null;   /* minuteur : auto-enregistrement dès la saisie d'une clé valide */


  /* ────────────────────────────────────────────────────────────
     1. LECTURE / SAUVEGARDE EN LOCALSTORAGE
  ──────────────────────────────────────────────────────────── */
  /* La fonction qui lit la clé enregistrée. */
  function getKey() {
    /* On tente de lire le localStorage ; s'il n'y a rien, on renvoie une chaîne vide. */
    try { return localStorage.getItem(STORAGE_KEY) || ''; }
    /* Si le navigateur bloque le localStorage (navigation privée stricte), on renvoie une chaîne vide au lieu de planter. */
    catch (e) { return ''; }
  /* Fin de getKey. */
  }

  /* La fonction qui enregistre la clé. */
  function setKey(k) {
    /* On tente d'écrire dans le localStorage… */
    try { localStorage.setItem(STORAGE_KEY, k); }
    /* …et on ignore l'erreur si c'est impossible. */
    catch (e) {}
  /* Fin de setKey. */
  }


  /* ────────────────────────────────────────────────────────────
     2. MONKEY-PATCH DE window.fetch
        Intercepte tout appel vers formspree.io/f/*
        et remplace la clé par celle stockée.
  ──────────────────────────────────────────────────────────── */
  /* L'astuce centrale de ce fichier : on « intercepte » la fonction fetch du navigateur. */
  function patchFetch(key) {
    /* Si on n'a pas de clé, ou si fetch est déjà patché avec cette même clé, on ne fait rien. */
    if (!key || window._fsPatchedKey === key) return;
    /* On garde de côté la vraie fonction fetch (ou celle déjà sauvegardée lors d'un patch précédent). */
    var native = window._fsNativeFetch || window.fetch;
    /* On la mémorise sur window pour pouvoir la retrouver plus tard. */
    window._fsNativeFetch = native;
    /* On remplace window.fetch par notre propre fonction, qui reçoit la même adresse et les mêmes options. */
    window.fetch = function (url, opts) {
      /* Si l'appel part vers une adresse Formspree… */
      if (typeof url === 'string' && url.indexOf('formspree.io/f/') !== -1) {
        /* …on remplace l'adresse par celle qui contient NOTRE clé : le formulaire envoie toujours vers le bon compte. */
        url = 'https://formspree.io/f/' + key;
      /* Fin de la condition. */
      }
      /* Dans tous les cas, on appelle la vraie fonction fetch avec l'adresse (éventuellement corrigée). */
      return native.call(this, url, opts);
    /* Fin de notre fetch personnalisé. */
    };
    /* On note la clé avec laquelle fetch a été patché. */
    window._fsPatchedKey = key;
  /* Fin de patchFetch. */
  }

  /* Patch immédiat si une clé est déjà sauvegardée */
  /* Au chargement du fichier, on lit la clé déjà enregistrée… */
  var existingKey = getKey();
  /* …et s'il y en a une, on patche fetch tout de suite, avant même que la page soit affichée. */
  if (existingKey) patchFetch(existingKey);


  /* ────────────────────────────────────────────────────────────
     3. INJECTION DES STYLES CSS
        Reprend les variables et la typographie du portfolio.
  ──────────────────────────────────────────────────────────── */
  /* La fonction qui ajoute les styles de la modale et du bouton dans la page. */
  function injectStyles() {
    /* Si la balise de style existe déjà, on ne l'ajoute pas deux fois. */
    if (document.getElementById(STYLES_ID)) return;
    /* On crée une balise <style>… */
    var s = document.createElement('style');
    /* …on lui donne son identifiant… */
    s.id  = STYLES_ID;
    /* …et on lui écrit son contenu, sous forme d'un tableau de lignes CSS qu'on assemblera à la fin. */
    s.textContent = [

      /* ── Bouton de navigation ── */
      /* Le conteneur du bouton dans la navbar : */
      '#' + NAV_WRAP_ID + ' {',
      /* en flexbox, centré verticalement, */
      '  display: flex; align-items: center;',
      /* avec un petit espace à gauche. */
      '  margin-left: .4rem;',
      /* Fin du conteneur. */
      '}',

      /* Le bouton « Formspree » : */
      '#' + BTN_ID + ' {',
      /* l'icône et le texte côte à côte, */
      '  display: inline-flex; align-items: center; gap: .4rem;',
      /* une marge intérieure, */
      '  padding: .38rem .85rem;',
      /* une forme de pilule, */
      '  border-radius: 100px;',
      /* une bordure bleue, */
      '  border: 1px solid rgba(59,130,246,.4);',
      /* un fond bleu transparent, */
      '  background: rgba(59,130,246,.12);',
      /* le bleu clair du portfolio, avec une couleur de secours si la variable n'existe pas, */
      '  color: var(--clr-accent3, #93c5fd);',
      /* la police monospace, */
      '  font-family: "IBM Plex Mono", monospace;',
      /* une taille de texte légèrement réduite, en graisse moyenne, */
      '  font-size: .9rem; font-weight: 500;',
      /* la main au survol, et un libellé qui ne passe jamais à la ligne, */
      '  cursor: pointer; white-space: nowrap;',
      /* des transitions douces sur les couleurs et l'ombre, */
      '  transition: background .25s, border-color .25s, color .25s, box-shadow .25s;',
      /* et un texte qu'on ne peut pas sélectionner par erreur. */
      '  user-select: none;',
      /* Fin du bouton. */
      '}',
      /* Au survol du bouton : */
      '#' + BTN_ID + ':hover {',
      /* le fond se renforce, */
      '  background: rgba(59,130,246,.25);',
      /* la bordure et le texte s'éclaircissent, */
      '  border-color: #60a5fa; color: #bfdbfe;',
      /* et une lueur bleue apparaît. */
      '  box-shadow: 0 0 16px rgba(59,130,246,.3);',
      /* Fin du survol. */
      '}',
      /* Au focus clavier : */
      '#' + BTN_ID + ':focus-visible {',
      /* un contour bleu bien visible. */
      '  outline: 2px solid rgba(96,165,250,.8); outline-offset: 2px;',
      /* Fin du focus. */
      '}',
      /* État actif : clé présente → indicateur vert */
      /* Quand une clé est enregistrée, le bouton reçoit la classe fs-key-ok et devient vert : */
      '#' + BTN_ID + '.fs-key-ok {',
      /* fond vert, */
      '  background: rgba(52,211,153,.12);',
      /* bordure verte, */
      '  border-color: rgba(52,211,153,.4);',
      /* texte vert clair. */
      '  color: #6ee7b7;',
      /* Fin de l'état vert. */
      '}',
      /* Le survol de l'état vert : */
      '#' + BTN_ID + '.fs-key-ok:hover {',
      /* fond plus marqué, */
      '  background: rgba(52,211,153,.22);',
      /* bordure et texte plus lumineux, */
      '  border-color: #34d399; color: #a7f3d0;',
      /* et lueur verte. */
      '  box-shadow: 0 0 16px rgba(52,211,153,.25);',
      /* Fin du survol vert. */
      '}',
      /* Thème clair */
      /* En thème clair, le bouton : */
      '[data-theme="light"] #' + BTN_ID + ' {',
      /* un fond bleu léger, */
      '  background: rgba(59,130,246,.1);',
      /* une bordure et un texte bleus plus foncés, lisibles sur fond clair. */
      '  border-color: rgba(59,130,246,.35); color: #2563eb;',
      /* Fin. */
      '}',
      /* Son survol en thème clair : */
      '[data-theme="light"] #' + BTN_ID + ':hover {',
      /* un fond un peu plus marqué, */
      '  background: rgba(59,130,246,.2);',
      /* une bordure et un texte encore plus foncés. */
      '  border-color: #3b82f6; color: #1d4ed8;',
      /* Fin. */
      '}',
      /* L'état vert en thème clair : */
      '[data-theme="light"] #' + BTN_ID + '.fs-key-ok {',
      /* un fond vert léger, */
      '  background: rgba(5,150,105,.1);',
      /* une bordure et un texte verts foncés. */
      '  border-color: rgba(5,150,105,.4); color: #059669;',
      /* Fin. */
      '}',

      /* ── Exclusion impression ── */
      /* À l'impression : */
      '@media print {',
      /* la modale et le bouton sont masqués, ils n'ont rien à faire sur un CV papier. */
      '  #' + MODAL_ID + ', #' + NAV_WRAP_ID + ' { display: none !important; }',
      /* Fin de la règle d'impression. */
      '}',

      /* ── Overlay de la modal ── */
      /* L'animation d'apparition du fond : de transparent à opaque. */
      '@keyframes fsOverlayIn { from { opacity:0; } to { opacity:1; } }',
      /* L'animation d'apparition de la carte : */
      '@keyframes fsCardIn {',
      /* elle part 20 pixels plus bas, transparente et légèrement réduite, */
      '  from { opacity:0; transform: translateY(20px) scale(.97); }',
      /* et arrive à sa place, opaque et à sa taille normale. */
      '  to   { opacity:1; transform: translateY(0)    scale(1);   }',
      /* Fin de l'animation. */
      '}',
      /* L'animation de pulsation du point de statut : */
      '@keyframes fsDotPulse {',
      /* opaque et à taille normale au début et à la fin, */
      '  0%,100% { opacity:1; transform:scale(1); }',
      /* plus transparent et réduit à mi-parcours. */
      '  50%      { opacity:.4; transform:scale(.65); }',
      /* Fin de l'animation. */
      '}',

      /* Le fond de la modale (l'overlay) : */
      '#' + MODAL_ID + ' {',
      /* masqué par défaut, */
      '  display: none;',
      /* fixé sur tout l'écran, au-dessus de tout (z-index 10000), */
      '  position: fixed; inset: 0; z-index: 10000;',
      /* un voile bleu nuit presque opaque, */
      '  background: rgba(2,6,18,.78);',
      /* qui floute la page derrière lui, */
      '  backdrop-filter: blur(10px);',
      /* (la même règle pour Safari), */
      '  -webkit-backdrop-filter: blur(10px);',
      /* la carte sera centrée dans l'écran, */
      '  align-items: center; justify-content: center;',
      /* avec une petite marge sur mobile, */
      '  padding: 1rem;',
      /* et le fond apparaît en fondu. */
      '  animation: fsOverlayIn .22s ease;',
      /* Fin de l'overlay. */
      '}',
      /* Quand on lui ajoute la classe fs-open, l'overlay s'affiche en flexbox. */
      '#' + MODAL_ID + '.fs-open { display: flex; }',

      /* ── Carte modale ── */
      /* La carte de la modale : */
      '.fs-card {',
      /* le second fond du portfolio, avec une couleur de secours, */
      '  background: var(--clr-bg2, #0b1628);',
      /* une bordure bleue, */
      '  border: 1px solid rgba(96,165,250,.28);',
      /* des coins arrondis, */
      '  border-radius: 20px;',
      /* une marge intérieure généreuse, */
      '  padding: 2.4rem;',
      /* toute la largeur disponible, sans dépasser 460 pixels, */
      '  width: 100%; max-width: 460px;',
      /* une ombre profonde et une lueur bleue, */
      '  box-shadow: 0 32px 80px rgba(0,0,0,.65), 0 0 60px rgba(59,130,246,.1);',
      /* et l'animation d'arrivée. */
      '  animation: fsCardIn .3s cubic-bezier(.4,0,.2,1);',
      /* Fin de la carte. */
      '}',
      /* La carte en thème clair : */
      '[data-theme="light"] .fs-card {',
      /* un fond blanc, */
      '  background: #ffffff;',
      /* une bordure bleue légère, */
      '  border-color: rgba(59,130,246,.22);',
      /* et une ombre plus douce. */
      '  box-shadow: 0 24px 60px rgba(0,0,0,.14);',
      /* Fin. */
      '}',

      /* ── En-tête ── */
      /* L'en-tête de la carte : */
      '.fs-card-header {',
      /* en flexbox, aligné en haut, */
      '  display: flex; align-items: flex-start;',
      /* l'icône et le titre à gauche, la croix de fermeture à droite, */
      '  justify-content: space-between; gap: .75rem;',
      /* avec de l'espace en dessous. */
      '  margin-bottom: 1.5rem;',
      /* Fin de l'en-tête. */
      '}',
      /* Le carré de l'icône : */
      '.fs-card-icon {',
      /* 46 pixels de côté, aux coins arrondis, */
      '  width: 46px; height: 46px; border-radius: 13px;',
      /* un fond bleu transparent, */
      '  background: rgba(59,130,246,.14);',
      /* une bordure bleue, */
      '  border: 1px solid rgba(59,130,246,.3);',
      /* l'icône centrée, */
      '  display: flex; align-items: center; justify-content: center;',
      /* une icône bleue, et un carré qui ne rétrécit jamais. */
      '  font-size: 1.2rem; color: #60a5fa; flex-shrink: 0;',
      /* Fin du carré. */
      '}',
      /* Le bloc titre prend toute la place restante. */
      '.fs-card-meta { flex: 1; }',
      /* Le titre de la modale : */
      '.fs-card-title {',
      /* la police Syne, */
      '  font-family: "Syne", sans-serif;',
      /* en graisse maximale, */
      '  font-weight: 800; font-size: 1.2rem;',
      /* la couleur des titres, */
      '  color: var(--clr-heading, #f0f6ff);',
      /* une petite marge en dessous et un interligne serré. */
      '  margin: 0 0 .22rem; line-height: 1.2;',
      /* Fin du titre. */
      '}',
      /* Le sous-titre : */
      '.fs-card-sub {',
      /* la police monospace, */
      '  font-family: "IBM Plex Mono", monospace;',
      /* en petit, */
      '  font-size: .8rem;',
      /* en texte secondaire, */
      '  color: var(--clr-text-soft, #94a3b8);',
      /* sans marge. */
      '  margin: 0;',
      /* Fin du sous-titre. */
      '}',
      /* Le bouton de fermeture : */
      '.fs-close-btn {',
      /* un rond de 32 pixels, */
      '  width: 32px; height: 32px; border-radius: 50%;',
      /* une fine bordure blanche, */
      '  border: 1px solid rgba(255,255,255,.1);',
      /* un fond très léger, */
      '  background: rgba(255,255,255,.05);',
      /* une croix en texte secondaire, */
      '  color: var(--clr-text-soft, #94a3b8);',
      /* la main au survol, */
      '  cursor: pointer; font-size: .9rem;',
      /* la croix centrée, */
      '  display: flex; align-items: center; justify-content: center;',
      /* des transitions sur les couleurs, */
      '  transition: background .2s, color .2s, border-color .2s;',
      /* et il ne rétrécit jamais. */
      '  flex-shrink: 0; margin-top: .1rem;',
      /* Fin du bouton de fermeture. */
      '}',
      /* Au survol de la croix : */
      '.fs-close-btn:hover {',
      /* un fond rouge transparent, */
      '  background: rgba(248,113,113,.15);',
      /* une croix et une bordure rouges : on comprend qu'on va fermer. */
      '  color: #f87171; border-color: rgba(248,113,113,.35);',
      /* Fin du survol. */
      '}',
      /* Au focus clavier, un contour bleu. */
      '.fs-close-btn:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }',

      /* ── Bande statut ── */
      /* La bande de statut, jaune quand aucune clé n'est configurée : */
      '.fs-status {',
      /* le point et le texte côte à côte, */
      '  display: flex; align-items: center; gap: .6rem;',
      /* un fond jaune très léger, */
      '  background: rgba(251,191,36,.07);',
      /* une bordure jaune, */
      '  border: 1px solid rgba(251,191,36,.25);',
      /* des coins arrondis et une marge intérieure, */
      '  border-radius: 10px; padding: .7rem 1rem;',
      /* de l'espace en dessous, */
      '  margin-bottom: 1.4rem;',
      /* la police monospace, */
      '  font-family: "IBM Plex Mono", monospace;',
      /* un texte jaune, */
      '  font-size: .82rem; color: #fcd34d;',
      /* et des transitions quand elle passe au vert. */
      '  transition: background .3s, border-color .3s, color .3s;',
      /* Fin de la bande. */
      '}',
      /* La bande passe au vert quand une clé est active : */
      '.fs-status.fs-status-ok {',
      /* fond vert, */
      '  background: rgba(52,211,153,.08);',
      /* bordure verte, */
      '  border-color: rgba(52,211,153,.25);',
      /* texte vert. */
      '  color: #6ee7b7;',
      /* Fin. */
      '}',
      /* Le point de la bande : */
      '.fs-status-dot {',
      /* un rond de 7 pixels, */
      '  width: 7px; height: 7px; border-radius: 50%;',
      /* de la même couleur que le texte (currentColor), */
      '  background: currentColor; flex-shrink: 0;',
      /* qui pulse. */
      '  animation: fsDotPulse 1.8s ease infinite;',
      /* Fin du point. */
      '}',

      /* ── Champ de saisie ── */
      /* L'étiquette du champ : */
      '.fs-field-label {',
      /* sur sa propre ligne, */
      '  display: block;',
      /* la police monospace, */
      '  font-family: "IBM Plex Mono", monospace;',
      /* en petit, avec des lettres espacées, */
      '  font-size: .78rem; letter-spacing: .08em;',
      /* en majuscules, */
      '  text-transform: uppercase;',
      /* en texte secondaire, */
      '  color: var(--clr-text-soft, #94a3b8);',
      /* avec un peu d'espace en dessous. */
      '  margin-bottom: .5rem;',
      /* Fin de l'étiquette. */
      '}',
      /* Le texte d'aide : */
      '.fs-hint {',
      /* la police du texte courant, */
      '  font-family: "DM Sans", sans-serif;',
      /* un peu plus petit, */
      '  font-size: .9rem;',
      /* en texte discret, */
      '  color: var(--clr-text-faint, #475569);',
      /* un interligne aéré et de l'espace en dessous. */
      '  line-height: 1.55; margin-bottom: .9rem;',
      /* Fin de l'aide. */
      '}',
      /* Le mot important de l'aide passe en bleu. */
      '.fs-hint strong { color: var(--clr-accent2, #60a5fa); }',
      /* L'aperçu de la clé, façon code : */
      '.fs-hint code {',
      /* la police monospace, */
      '  font-family: "IBM Plex Mono", monospace;',
      /* sur un fond bleu léger, */
      '  background: rgba(59,130,246,.1);',
      /* avec une petite marge intérieure et des coins arrondis. */
      '  padding: 1px 6px; border-radius: 4px; font-size: .85em;',
      /* Fin de l'aperçu. */
      '}',
      /* Le conteneur du champ : position relative, pour y placer le préfixe « f/ ». */
      '.fs-input-wrap { position: relative; margin-bottom: .5rem; }',
      /* Le préfixe « f/ » affiché dans le champ : */
      '.fs-prefix {',
      /* positionné à gauche, au milieu du champ, */
      '  position: absolute; left: 13px; top: 50%;',
      /* recentré verticalement, */
      '  transform: translateY(-50%);',
      /* la police monospace, */
      '  font-family: "IBM Plex Mono", monospace;',
      /* en bleu, */
      '  font-size: .9rem; color: var(--clr-accent, #3b82f6);',
      /* et il laisse passer les clics vers le champ. */
      '  pointer-events: none; user-select: none;',
      /* Fin du préfixe. */
      '}',
      /* Le champ de saisie : */
      '.fs-input {',
      /* toute la largeur, bordure comprise, */
      '  width: 100%; box-sizing: border-box;',
      /* une marge intérieure, plus large à gauche pour laisser la place au préfixe, */
      '  padding: .78rem .9rem .78rem 2.5rem;',
      /* un fond de verre, */
      '  background: var(--clr-surface, rgba(255,255,255,.04));',
      /* une bordure bleutée, */
      '  border: 1px solid var(--clr-border, rgba(96,165,250,.18));',
      /* des coins arrondis, */
      '  border-radius: 10px;',
      /* le texte courant, */
      '  color: var(--clr-text, #e2e8f0);',
      /* la police monospace, */
      '  font-family: "IBM Plex Mono", monospace;',
      /* une taille confortable, et on retire le contour par défaut du navigateur, */
      '  font-size: 1.05rem; outline: none;',
      /* avec des transitions douces. */
      '  transition: border-color .2s, background .2s, box-shadow .2s;',
      /* Fin du champ. */
      '}',
      /* Le texte d'exemple du champ, en couleur discrète. */
      '.fs-input::placeholder { color: var(--clr-text-faint, #334155); }',
      /* Quand le champ a le focus : */
      '.fs-input:focus {',
      /* la bordure passe en bleu, */
      '  border-color: var(--clr-accent, #3b82f6);',
      /* le fond devient bleuté, */
      '  background: rgba(59,130,246,.06);',
      /* et un halo bleu apparaît autour. */
      '  box-shadow: 0 0 0 3px rgba(59,130,246,.15);',
      /* Fin du focus. */
      '}',
      /* Quand la clé est invalide : */
      '.fs-input.fs-invalid {',
      /* la bordure passe en rouge, */
      '  border-color: var(--clr-danger, #f87171);',
      /* avec un halo rouge. */
      '  box-shadow: 0 0 0 3px rgba(248,113,113,.15);',
      /* Fin de l'état invalide. */
      '}',

      /* ── Message retour ── */
      /* Le message de retour sous le champ : */
      '.fs-feedback {',
      /* une hauteur minimale, pour que la carte ne saute pas quand le message apparaît, */
      '  min-height: 1.3rem;',
      /* la police monospace, */
      '  font-family: "IBM Plex Mono", monospace;',
      /* en petit, avec de l'espace en dessous, */
      '  font-size: .82rem; margin-bottom: .85rem;',
      /* et une transition sur la couleur. */
      '  line-height: 1.4; transition: color .2s;',
      /* Fin du message. */
      '}',

      /* ── Bouton enregistrer ── */
      /* Le bouton « Enregistrer et activer » : */
      '.fs-save-btn {',
      /* toute la largeur, avec une marge intérieure, */
      '  width: 100%; padding: .92rem 1.5rem;',
      /* le dégradé bleu vers teal du portfolio, */
      '  background: linear-gradient(135deg, var(--clr-accent, #3b82f6), var(--clr-teal, #0ea5e9));',
      /* sans bordure, aux coins arrondis, texte blanc, */
      '  border: none; border-radius: 13px; color: #fff;',
      /* la police Syne, */
      '  font-family: "Syne", sans-serif;',
      /* en gras, avec la main au survol, */
      '  font-weight: 700; font-size: 1.05rem; cursor: pointer;',
      /* l'icône et le texte alignés, */
      '  display: inline-flex; align-items: center;',
      /* centrés et espacés, */
      '  justify-content: center; gap: .5rem;',
      /* des transitions douces, */
      '  transition: opacity .2s, transform .2s, box-shadow .2s;',
      /* et une lueur bleue dessous. */
      '  box-shadow: 0 4px 20px rgba(59,130,246,.3);',
      /* Fin du bouton. */
      '}',
      /* Au survol : */
      '.fs-save-btn:hover {',
      /* il s'éclaircit légèrement et monte de 2 pixels, */
      '  opacity: .88; transform: translateY(-2px);',
      /* et sa lueur s'intensifie. */
      '  box-shadow: 0 8px 30px rgba(59,130,246,.45);',
      /* Fin du survol. */
      '}',
      /* Au moment du clic, il redescend. */
      '.fs-save-btn:active { transform: translateY(0); opacity: 1; }',
      /* Au focus clavier : */
      '.fs-save-btn:focus-visible {',
      /* un contour bleu clair. */
      '  outline: 3px solid #93c5fd; outline-offset: 3px;',
      /* Fin du focus. */
      '}',

      /* ── Pied de carte ── */
      /* Le pied de la carte : */
      '.fs-card-footer {',
      /* un espace au-dessus, */
      '  margin-top: 1.1rem;',
      /* la police monospace, */
      '  font-family: "IBM Plex Mono", monospace;',
      /* en petit, */
      '  font-size: .76rem;',
      /* en texte discret, */
      '  color: var(--clr-text-faint, #475569);',
      /* centré, avec un interligne aéré. */
      '  text-align: center; line-height: 1.7;',
      /* Fin du pied. */
      '}',
      /* Les touches de clavier affichées dans le pied (<kbd>) : */
      '.fs-card-footer kbd {',
      /* en ligne, */
      '  display: inline-block;',
      /* un fond très léger, */
      '  background: rgba(255,255,255,.06);',
      /* une fine bordure, */
      '  border: 1px solid rgba(255,255,255,.12);',
      /* des coins arrondis et une petite marge, */
      '  border-radius: 4px; padding: 0 5px;',
      /* la police du pied, un peu plus petite, */
      '  font-family: inherit; font-size: .9em;',
      /* en texte secondaire. */
      '  color: var(--clr-text-soft, #94a3b8);',
      /* Fin des touches. */
      '}',
      /* Les touches en thème clair : */
      '[data-theme="light"] .fs-card-footer kbd {',
      /* un fond légèrement gris, */
      '  background: rgba(0,0,0,.05);',
      /* une bordure grise. */
      '  border-color: rgba(0,0,0,.15);',
      /* Fin. */
      '}',

      /* ── Responsive mobile ── */
      /* Sur les petits écrans, sous 480 pixels : */
      '@media (max-width: 480px) {',
      /* la carte a moins de marge intérieure, */
      '  .fs-card { padding: 1.6rem 1.3rem; }',
      /* et le titre est un peu plus petit. */
      '  .fs-card-title { font-size: 1.05rem; }',
      /* Fin de la règle mobile (dernier élément du tableau, donc sans virgule). */
      '}'

    /* On referme le tableau et on assemble toutes ses lignes en un seul texte CSS, séparées par des retours à la ligne. */
    ].join('\n');

    /* On ajoute la balise <style> dans le <head> de la page : les styles s'appliquent immédiatement. */
    document.head.appendChild(s);
  /* Fin d'injectStyles. */
  }


  /* ────────────────────────────────────────────────────────────
     4. INJECTION DU BOUTON DANS LA NAVBAR
        Même pattern que les boutons Éditer / PDF existants :
        insertion avant le groupe .ms-lg-3 (bouton thème).
  ──────────────────────────────────────────────────────────── */
  /* La fonction qui ajoute le bouton « Formspree » dans la navbar. */
  function injectNavButton() {
    /* S'il existe déjà, on ne le recrée pas. */
    if (document.getElementById(NAV_WRAP_ID)) return;

    /* On récupère la partie repliable du menu, construite à l'épisode 03. */
    var navContent = document.getElementById('navContent');
    /* Si elle n'existe pas, on s'arrête. */
    if (!navContent) return;

    /* On crée le petit conteneur… */
    var wrap = document.createElement('div');
    /* …et on lui donne son identifiant. */
    wrap.id  = NAV_WRAP_ID;

    /* On crée le bouton… */
    var btn      = document.createElement('button');
    /* …avec son identifiant… */
    btn.id       = BTN_ID;
    /* …et le type button, pour qu'il ne soumette jamais de formulaire. */
    btn.type     = 'button';
    /* Un nom clair pour les lecteurs d'écran. */
    btn.setAttribute('aria-label', 'Configurer la clé Formspree pour le formulaire de contact');
    /* Une infobulle qui rappelle le raccourci clavier. */
    btn.setAttribute('title',      'Config Formspree  ·  Ctrl + Shift + F');
    /* Le contenu du bouton : */
    btn.innerHTML =
      /* une icône avion en papier… */
      '<i class="fas fa-paper-plane" aria-hidden="true"></i>' +
      /* …et le mot « Formspree ». */
      '<span>Formspree</span>';

    /* Un clic sur le bouton ouvre la modale. */
    btn.addEventListener('click', openModal);
    /* On place le bouton dans son conteneur. */
    wrap.appendChild(btn);

    /* Insérer avant le groupe thème (même ancre que les boutons éditeur) */
    /* On cherche le groupe du bouton thème (la div .ms-lg-3 de l'épisode 03). */
    var themeWrap = navContent.querySelector('.ms-lg-3');
    /* S'il existe… */
    if (themeWrap) {
      /* …on insère notre bouton juste avant lui. */
      navContent.insertBefore(wrap, themeWrap);
    /* Sinon… */
    } else {
      /* …on l'ajoute à la fin du menu. */
      navContent.appendChild(wrap);
    /* Fin de la condition. */
    }

    /* On colore le bouton en vert si une clé est déjà enregistrée. */
    refreshBtnState();
  /* Fin d'injectNavButton. */
  }


  /* ────────────────────────────────────────────────────────────
     5. INJECTION DE LA MODAL
  ──────────────────────────────────────────────────────────── */
  /* La fonction qui construit la modale. */
  function injectModal() {
    /* Si elle existe déjà, on ne la recrée pas. */
    if (document.getElementById(MODAL_ID)) return;

    /* On crée le fond de la modale… */
    var overlay = document.createElement('div');
    /* …avec son identifiant. */
    overlay.id  = MODAL_ID;
    /* Pour les lecteurs d'écran, c'est une boîte de dialogue… */
    overlay.setAttribute('role',            'dialog');
    /* …modale : le reste de la page est inactif pendant qu'elle est ouverte… */
    overlay.setAttribute('aria-modal',      'true');
    /* …et son nom est le titre fs-title. */
    overlay.setAttribute('aria-labelledby', 'fs-title');

    /* On écrit son contenu HTML sous forme de chaînes de caractères mises bout à bout : */
    overlay.innerHTML =
      /* la carte. */
      '<div class="fs-card" role="document">' +

        /* ── En-tête ── */
        /* L'en-tête : */
        '<div class="fs-card-header">' +
          /* le carré de l'icône, */
          '<div class="fs-card-icon" aria-hidden="true">' +
            /* l'icône avion en papier, */
            '<i class="fas fa-paper-plane"></i>' +
          /* fin du carré ; */
          '</div>' +
          /* le bloc titre, */
          '<div class="fs-card-meta">' +
            /* le titre « Clé Formspree », */
            '<p class="fs-card-title" id="fs-title">Clé Formspree</p>' +
            /* le sous-titre, */
            '<p class="fs-card-sub">formspree.io · formulaire de contact</p>' +
          /* fin du bloc titre ; */
          '</div>' +
          /* le bouton de fermeture, nommé « Fermer » pour les lecteurs d'écran, */
          '<button class="fs-close-btn" id="fs-close" aria-label="Fermer">' +
            /* avec une icône de croix, */
            '<i class="fas fa-times" aria-hidden="true"></i>' +
          /* fin du bouton ; */
          '</button>' +
        /* fin de l'en-tête. */
        '</div>' +

        /* ── Bande de statut ── */
        /* La bande de statut : */
        '<div class="fs-status fs-status-none" id="fs-status">' +
          /* son point qui pulse, */
          '<span class="fs-status-dot" aria-hidden="true"></span>' +
          /* son texte, qui sera mis à jour par le script, */
          '<span id="fs-status-txt">Aucune clé configurée — formulaire inactif</span>' +
        /* fin de la bande. */
        '</div>' +

        /* ── Champ de saisie ── */
        /* L'étiquette du champ, reliée au champ par for. */
        '<label class="fs-field-label" for="fs-input">Identifiant Formspree</label>' +
        /* Le texte d'aide : */
        '<p class="fs-hint">' +
          /* où trouver la clé, */
          'Copiez la clé depuis votre dashboard :<br>' +
          /* l'adresse Formspree, avec un aperçu de la clé mis à jour en direct, */
          '<strong>formspree.io/f/<code id="fs-preview">xxxxxxxx</code></strong>' +
        /* fin de l'aide. */
        '</p>' +
        /* Le conteneur du champ : */
        '<div class="fs-input-wrap">' +
          /* le préfixe « f/ », */
          '<span class="fs-prefix" aria-hidden="true">f/</span>' +
          /* le champ de saisie : */
          '<input' +
          /* son identifiant, sa classe, et son type texte, */
          '  id="fs-input" class="fs-input" type="text"' +
          /* un exemple de clé et 20 caractères au maximum, */
          '  placeholder="xabcd1234" maxlength="20"' +
          /* sans saisie automatique, sans correction et sans vérification orthographique : une clé n'est pas un mot, */
          '  autocomplete="off" autocorrect="off" spellcheck="false"' +
          /* et relié au message de retour pour les lecteurs d'écran, */
          '  aria-describedby="fs-fb"' +
          /* fin du champ ; */
          '/>' +
        /* fin du conteneur. */
        '</div>' +
        /* La zone du message de retour, lue par les lecteurs d'écran quand elle change. */
        '<div class="fs-feedback" id="fs-fb" role="status" aria-live="polite"></div>' +

        /* ── Bouton ── */
        /* Le bouton d'enregistrement : */
        '<button class="fs-save-btn" id="fs-save" type="button">' +
          /* une icône de coche, */
          '<i class="fas fa-check" aria-hidden="true"></i>' +
          /* son texte, */
          'Enregistrer et activer' +
        /* fin du bouton. */
        '</button>' +

        /* ── Pied ── */
        /* Le pied de la carte : */
        '<p class="fs-card-footer">' +
          /* où la clé est stockée, */
          'Sauvegardée en <kbd>localStorage</kbd> · active dès ce rechargement<br>' +
          /* et le raccourci clavier pour rouvrir la modale, */
          'Rouvrir à tout moment : <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd>' +
        /* fin du pied. */
        '</p>' +

      /* Fin de la carte. */
      '</div>';

    /* On ajoute la modale à la fin du <body>. */
    document.body.appendChild(overlay);

    /* Fermer en cliquant sur l'overlay */
    /* Un clic sur le fond de la modale… */
    overlay.addEventListener('click', function (e) {
      /* …mais pas sur la carte elle-même, la referme. */
      if (e.target === overlay) closeModal();
    /* Fin de l'écouteur. */
    });

    /* Un clic sur la croix referme la modale. */
    document.getElementById('fs-close').addEventListener('click', closeModal);
    /* Un clic sur le bouton enregistre la clé. */
    document.getElementById('fs-save').addEventListener('click', saveKey);

    /* On récupère le champ de saisie. */
    var input = document.getElementById('fs-input');

    /* Aperçu en temps réel + reset validité + auto-enregistrement */
    /* À chaque frappe dans le champ : */
    input.addEventListener('input', function () {
      /* on lit la valeur, sans les espaces autour, */
      var v = input.value.trim();
      /* on met à jour l'aperçu de l'adresse, */
      document.getElementById('fs-preview').textContent = v || 'xxxxxxxx';
      /* on retire l'état d'erreur, */
      input.classList.remove('fs-invalid');
      /* et on efface le message de retour. */
      setFeedback('', '');

      /* Dès qu'une clé Formspree valide est saisie, on l'enregistre et la modal
         se ferme automatiquement (puis ne se réaffichera plus automatiquement). */
      /* On annule un éventuel enregistrement automatique déjà programmé. */
      if (_autoTimer) { clearTimeout(_autoTimer); _autoTimer = null; }
      /* Si la saisie ressemble à une clé Formspree (au moins 8 lettres ou chiffres)… */
      if (/^[A-Za-z0-9]{8,}$/.test(v)) {
        /* …on l'enregistre automatiquement 0,7 seconde après la dernière frappe. */
        _autoTimer = setTimeout(function () { saveKey(true); }, 700);
      /* Fin de la condition. */
      }
    /* Fin de l'écouteur de saisie. */
    });

    /* Touche Entrée = enregistrer */
    /* Quand on appuie sur une touche dans le champ… */
    input.addEventListener('keydown', function (e) {
      /* …Entrée enregistre la clé. */
      if (e.key === 'Enter') saveKey();
    /* Fin de l'écouteur clavier. */
    });
  /* Fin d'injectModal. */
  }


  /* ────────────────────────────────────────────────────────────
     6. OUVRIR LA MODAL
  ──────────────────────────────────────────────────────────── */
  /* La fonction qui ouvre la modale. */
  function openModal() {
    /* On récupère la modale… */
    var overlay = document.getElementById(MODAL_ID);
    /* …et on s'arrête si elle n'existe pas. */
    if (!overlay) return;

    /* Remplir le champ avec la clé sauvegardée */
    /* On lit la clé déjà enregistrée. */
    var saved = getKey();
    /* On récupère le champ. */
    var input = document.getElementById('fs-input');
    /* S'il existe… */
    if (input) {
      /* …on y place la clé enregistrée… */
      input.value = saved;
      /* …et on met à jour l'aperçu. */
      document.getElementById('fs-preview').textContent = saved || 'xxxxxxxx';
    /* Fin de la condition. */
    }

    /* On efface le message de retour. */
    setFeedback('', '');
    /* On met à jour la bande de statut. */
    refreshStatusBand();
    /* On affiche la modale. */
    overlay.classList.add('fs-open');
    /* On bloque le défilement de la page derrière elle. */
    document.body.style.overflow = 'hidden';

    /* Focus sur le champ (après l'animation CSS) */
    /* Un très court instant plus tard, après le début de l'animation… */
    setTimeout(function () {
      /* …on récupère le champ… */
      var inp = document.getElementById('fs-input');
      /* …on lui donne le focus, et on sélectionne la clé existante pour pouvoir la remplacer d'un coup. */
      if (inp) { inp.focus(); if (saved) inp.select(); }
    /* Fin du minuteur (60 millisecondes). */
    }, 60);
  /* Fin d'openModal. */
  }


  /* ────────────────────────────────────────────────────────────
     7. FERMER LA MODAL
  ──────────────────────────────────────────────────────────── */
  /* La fonction qui ferme la modale. */
  function closeModal() {
    /* On récupère la modale… */
    var overlay = document.getElementById(MODAL_ID);
    /* …et on s'arrête si elle n'existe pas. */
    if (!overlay) return;
    /* On la masque. */
    overlay.classList.remove('fs-open');
    /* On rend le défilement à la page. */
    document.body.style.overflow = '';
    /* Redonner le focus au bouton de la navbar */
    /* On récupère le bouton de la navbar… */
    var btn = document.getElementById(BTN_ID);
    /* …et on lui rend le focus : l'utilisateur au clavier retrouve sa place. */
    if (btn) btn.focus();
  /* Fin de closeModal. */
  }


  /* ────────────────────────────────────────────────────────────
     8. ENREGISTREMENT DE LA CLÉ
  ──────────────────────────────────────────────────────────── */
  /* La fonction qui enregistre la clé ; auto vaut true quand elle est appelée par l'enregistrement automatique. */
  function saveKey(auto) {
    /* On annule un éventuel enregistrement automatique en attente. */
    if (_autoTimer) { clearTimeout(_autoTimer); _autoTimer = null; }

    /* On récupère le champ. */
    var input = document.getElementById('fs-input');
    /* On lit la clé saisie, sans les espaces. */
    var key   = input ? input.value.trim() : '';

    /* Si le champ est vide : */
    if (!key) {
      /* en mode automatique, on ne dit rien ; */
      if (auto) return;                    /* mode auto : on ignore silencieusement */
      /* sinon, on passe le champ en rouge, */
      if (input) input.classList.add('fs-invalid');
      /* on affiche un message d'erreur, */
      setFeedback('⚠ Saisissez une clé avant d\'enregistrer.', 'danger');
      /* on remet le focus dans le champ, */
      if (input) input.focus();
      /* et on s'arrête. */
      return;
    /* Fin du cas « vide ». */
    }
    /* Si la clé fait moins de 6 caractères : */
    if (key.length < 6) {
      /* en mode automatique, on attend la suite de la saisie ; */
      if (auto) return;                    /* mode auto : on attend une clé complète */
      /* sinon, champ en rouge, */
      if (input) input.classList.add('fs-invalid');
      /* message d'erreur, */
      setFeedback('⚠ Clé trop courte — vérifiez sur formspree.io.', 'danger');
      /* focus dans le champ, */
      if (input) input.focus();
      /* et on s'arrête. */
      return;
    /* Fin du cas « trop courte ». */
    }

    /* La clé est valable : on l'enregistre dans le localStorage, */
    setKey(key);
    /* on patche fetch avec elle, */
    patchFetch(key);
    /* on retire l'état d'erreur du champ, */
    if (input) input.classList.remove('fs-invalid');
    /* la bande de statut passe au vert, */
    refreshStatusBand();
    /* le bouton de la navbar passe au vert, */
    refreshBtnState();
    /* et on affiche un message de confirmation. */
    setFeedback('✓ Clé active — le formulaire de contact est opérationnel.', 'success');

    /* La modal disparaît automatiquement dès qu'une clé valide est saisie ;
       grâce à la clé stockée, elle ne se réaffichera plus automatiquement ensuite. */
    /* On ferme la modale un peu plus tard, pour laisser le temps de lire la confirmation. */
    setTimeout(closeModal, auto ? 850 : 1200);
  /* Fin de saveKey. */
  }


  /* ────────────────────────────────────────────────────────────
     9. HELPERS UI
  ──────────────────────────────────────────────────────────── */
  /* La fonction qui affiche le message de retour. */
  function setFeedback(msg, type) {
    /* On récupère la zone du message… */
    var el = document.getElementById('fs-fb');
    /* …et on s'arrête si elle n'existe pas. */
    if (!el) return;
    /* On y écrit le message. */
    el.textContent  = msg;
    /* Sa couleur : vert pour un succès, */
    el.style.color  = type === 'success' ? 'var(--clr-success, #34d399)'
                    /* rouge pour une erreur, */
                    : type === 'danger'  ? 'var(--clr-danger,  #f87171)'
                    /* transparente sinon. */
                    :                      'transparent';
  /* Fin de setFeedback. */
  }

  /* La fonction qui met à jour la bande de statut. */
  function refreshStatusBand() {
    /* On récupère la bande… */
    var row  = document.getElementById('fs-status');
    /* …et son texte. */
    var text = document.getElementById('fs-status-txt');
    /* Si l'un des deux manque, on s'arrête. */
    if (!row || !text) return;
    /* On lit la clé enregistrée. */
    var key = getKey();
    /* S'il y en a une… */
    if (key) {
      /* …la bande passe au vert… */
      row.classList.add('fs-status-ok');
      /* …et affiche la clé active. */
      text.textContent = 'Clé active : f/' + key;
    /* Sinon… */
    } else {
      /* …la bande redevient jaune… */
      row.classList.remove('fs-status-ok');
      /* …et annonce que le formulaire est inactif. */
      text.textContent = 'Aucune clé configurée — formulaire inactif';
    /* Fin de la condition. */
    }
  /* Fin de refreshStatusBand. */
  }

  /* La fonction qui colore le bouton de la navbar. */
  function refreshBtnState() {
    /* On récupère le bouton… */
    var btn = document.getElementById(BTN_ID);
    /* …et on s'arrête s'il n'existe pas. */
    if (!btn) return;
    /* Vert s'il y a une clé… */
    if (getKey()) btn.classList.add('fs-key-ok');
    /* …couleur normale sinon. */
    else          btn.classList.remove('fs-key-ok');
  /* Fin de refreshBtnState. */
  }


  /* ────────────────────────────────────────────────────────────
     10. RACCOURCIS CLAVIER GLOBAUX
         Ctrl + Shift + F → toggle modal
         Escape           → fermer
  ──────────────────────────────────────────────────────────── */
  /* La fonction qui installe les raccourcis clavier. */
  function setupKeyboard() {
    /* On écoute toutes les touches pressées dans la page. */
    document.addEventListener('keydown', function (e) {

      /* Ctrl + Maj + F : */
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        /* on empêche l'action par défaut du navigateur, */
        e.preventDefault();
        /* on récupère la modale, */
        var overlay = document.getElementById(MODAL_ID);
        /* si elle est ouverte, on la ferme… */
        if (overlay && overlay.classList.contains('fs-open')) closeModal();
        /* …sinon, on l'ouvre, */
        else openModal();
        /* et on s'arrête là. */
        return;
      /* Fin du raccourci. */
      }

      /* La touche Échap : */
      if (e.key === 'Escape') {
        /* on récupère la modale, */
        var overlay = document.getElementById(MODAL_ID);
        /* et on la ferme si elle est ouverte. */
        if (overlay && overlay.classList.contains('fs-open')) closeModal();
      /* Fin de la touche Échap. */
      }
    /* Fin de l'écouteur clavier. */
    });
  /* Fin de setupKeyboard. */
  }


  /* ────────────────────────────────────────────────────────────
     11. PIÈGE DE FOCUS (accessibilité)
         Empêche Tab de sortir de la modal quand elle est ouverte.
  ──────────────────────────────────────────────────────────── */
  /* La fonction du piège de focus, indispensable pour l'accessibilité d'une modale. */
  function setupFocusTrap() {
    /* On écoute les touches pressées. */
    document.addEventListener('keydown', function (e) {
      /* Si ce n'est pas la touche Tab, on ne fait rien. */
      if (e.key !== 'Tab') return;
      /* On récupère la modale. */
      var overlay = document.getElementById(MODAL_ID);
      /* Si elle n'est pas ouverte, on ne fait rien. */
      if (!overlay || !overlay.classList.contains('fs-open')) return;

      /* On liste tous les éléments de la modale qui peuvent recevoir le focus : */
      var focusable = overlay.querySelectorAll(
        /* les boutons et champs actifs, et les éléments qui ont un tabindex positif ou nul. */
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      /* Fin de la liste. */
      );
      /* S'il n'y en a aucun, on s'arrête. */
      if (!focusable.length) return;

      /* Le premier élément… */
      var first = focusable[0];
      /* …et le dernier. */
      var last  = focusable[focusable.length - 1];

      /* Avec Maj + Tab (on recule) : */
      if (e.shiftKey) {
        /* si on est sur le premier, on boucle sur le dernier. */
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      /* Avec Tab seul (on avance) : */
      } else {
        /* si on est sur le dernier, on boucle sur le premier. */
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      /* Fin de la condition. */
      }
    /* Fin de l'écouteur. */
    });
  /* Fin de setupFocusTrap. */
  }


  /* ────────────────────────────────────────────────────────────
     12. INITIALISATION
  ──────────────────────────────────────────────────────────── */
  /* La fonction de démarrage. */
  function init() {
    /* On ajoute les styles, */
    injectStyles();
    /* le bouton de la navbar, */
    injectNavButton();
    /* la modale, */
    injectModal();
    /* les raccourcis clavier, */
    setupKeyboard();
    /* et le piège de focus. */
    setupFocusTrap();

    /* Ouverture automatique à la première visite (aucune clé sauvegardée) */
    /* À la première visite, s'il n'y a encore aucune clé… */
    if (!getKey()) {
      /* …on ouvre la modale automatiquement après 0,9 seconde. */
      setTimeout(openModal, 900);
    /* Fin de la condition. */
    }
  /* Fin d'init. */
  }

  /* Si la page est encore en cours de chargement (c'est le cas, puisque config.js est dans le <head>)… */
  if (document.readyState === 'loading') {
    /* …on attend que le HTML soit prêt pour lancer init. */
    document.addEventListener('DOMContentLoaded', init);
  /* Sinon… */
  } else {
    /* …on lance init tout de suite. */
    init();
  /* Fin de la condition. */
  }

/* On referme la fonction auto-exécutée et on la lance. */
})();