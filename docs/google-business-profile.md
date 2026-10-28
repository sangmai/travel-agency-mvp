# Google Business Profile — fiche de saisie

<!-- ⚠️ FICHIER GÉNÉRÉ par scripts/make-gbp-sheet.mjs. Ne pas modifier à la
     main : corriger content/site.json et relancer `npm run gbp`. -->

À créer sur <https://business.google.com>. La vérification — carte postale,
téléphone ou vidéo — ne peut être faite que par l'établissement lui-même.

## Pourquoi copier d'ici plutôt que du site

Le nom, l'adresse et le téléphone doivent être **identiques au caractère
près** entre cette fiche, le pied de page du site et les données structurées.
C'est l'un des rares facteurs de référencement local qui se vérifie à la
lettre : pour un moteur, « 270 Nguyen Luong Bang » et « 270, Nguyễn Lương
Bằng » désignent deux établissements distincts. Ce document est produit
depuis la même source que le site, il n'y a donc rien à retaper.

## Champs à remplir

| Champ Google | Valeur exacte | Remarque |
|---|---|---|
| Nom de l'établissement | `Jasmin Travel` | Sans suffixe ni slogan : Google sanctionne le bourrage de mots-clés dans le nom. |
| Catégorie principale | `Agence de voyages` | |
| Catégorie secondaire | `Voyagiste` | |
| Adresse | `270 Nguyen Luong Bang, Da Nang, Vietnam` | |
| Code postal | `550000` | |
| Téléphone | `+84 935 16 52 84` | Le même que sur le site, format international compris. |
| Site web | `https://travel-agency-mvp.maisang90dn.workers.dev` | À mettre à jour le jour du passage au domaine définitif. |
| Horaires | `09:00–18:00` | Ouvert lundi, mardi, mercredi, jeudi, vendredi. Fermé samedi et dimanche. |
| Zone desservie | `Vietnam, Laos, Cambodge` | L'agence se déplace chez le client : déclarer la zone en plus de l'adresse. |
| Année d'ouverture | `2015` | Correspond à la licence de tour-opérateur. |

## Description (750 caractères maximum)

> Jasmin Travel est une agence de voyage locale francophone au Vietnam, installée à
> Da Nang et titulaire de la licence de tour-opérateur
> international 48-049/2015/TCDL-GP LHQT. Nous concevons et opérons nous-mêmes des
> circuits privés sur mesure au Vietnam, au Laos et au Cambodge, pour une
> clientèle francophone. Pas d'intermédiaire entre vous et l'équipe qui
> réserve les hôtels et missionne les guides : le même interlocuteur du
> premier message jusqu'au retour. Devis gratuit et détaillé sous
> 48 h ouvrées.

## Après la validation

1. Ajouter l'adresse de la fiche à `sameAs` dans `content/site.json`, puis
   `npm run build`. Les moteurs sauront alors que la fiche et le site
   désignent la même entreprise — ce qui compte d'autant plus qu'une
   « Jasmine Tours Ha Giang » sans rapport est bien mieux référencée.
2. Basculer `reviewSource` de Tripadvisor vers Google dès que les avis y
   sont plus nombreux.
3. Demander un avis après chaque voyage. C'est la seule façon d'en obtenir,
   et la raison pour laquelle une agence en activité depuis 2015
   n'en compte que 3 : personne n'a encore posé la
   question.

## Message à envoyer au retour

> Bonjour {prénom},
>
> J'espère que le retour s'est bien passé et que le Vietnam vous laisse de
> beaux souvenirs.
>
> Si le voyage vous a plu, quelques lignes publiques nous aideraient
> beaucoup — c'est ce que lisent les voyageurs qui hésitent encore, et nous
> n'avons pas d'autre moyen de leur montrer notre travail :
> {lien court de la fiche Google}
>
> Et si quelque chose n'a pas été à la hauteur, dites-le-moi d'abord à moi.
>
> {prénom du conseiller}, Jasmin Travel

Un lien direct, un message personnel, envoyé dans la semaine du retour. Ni
relance, ni contrepartie : offrir quoi que ce soit contre un avis est
interdit par Google et par le droit français.
