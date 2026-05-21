# boodschappen-app

Minimale lokale browserapp voor issue #468. Open `index.html` vanuit deze map direct in een browser.

## Gebruik

- Voeg een product toe via naam, categorie, voorraad en minimumvoorraad.
- Kies een bestaande categorie of vul een nieuwe categorie in om die direct toe te voegen.
- Pas voorraad en minimumvoorraad per product aan in de lijst.
- Een product krijgt de markering **Moet op boodschappenlijst** zodra voorraad lager is dan minimumvoorraad.
- Verwijder een product via de knop **Verwijderen**.

## Opslag en scope

- Gegevens worden alleen lokaal in de browser opgeslagen via `localStorage`.
- Er is geen sync tussen apparaten.
- Er is geen login of auth.
- Er is geen backend of externe API.
- Er zijn geen pushnotificaties.
- Er is geen fotoherkenning of AI.
- Er is geen deployment of hostingconfiguratie.
