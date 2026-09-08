# Sport Track

Application mobile (PWA) de suivi d'activité sportive, construite à partir du fichier `Dashboard_sport.xlsx` : étirements, séance du jour, repas, suppléments, sommeil, résultat de la journée et suivi de poids vers un objectif.

## Fonctionnalités

- **Accueil** : résumé du jour, moyennes (repas, sommeil), série d'étirements, répartition des résultats (Bon / Neutre / Mauvais), progression du poids.
- **Journal** : historique des journées, ajout/édition/suppression d'une entrée.
- **Poids** : courbe de poids vs. objectif, ajout de pesées.
- **Réglages** : date/poids de départ et objectif, réinitialisation des données.

Les données sont stockées en local (`localStorage`) sur l'appareil — aucun compte ni serveur nécessaire. L'app est installable sur l'écran d'accueil (PWA) et fonctionne hors-ligne.

## Développement

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
