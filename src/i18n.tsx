"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "fr";

const en = {
  banner: {
    line: "An open-source civic project. Not affiliated with the Government of Canada or the City of Toronto.",
    badge: "Open source",
  },
  nav: {
    trend: "Trend",
    bubbles: "Causes",
    fingerprints: "Fingerprints",
    lines: "Lines",
    timing: "Timing",
    crosswalk: "Crosswalk",
    methodology: "Methodology",
    developers: "Developers",
    data: "Data",
    back: "All projects",
  },
  hero: {
    kicker: "Nshipyard Canada · TTC delay analysis",
    title: "Every TTC delay since 2014, on one chart.",
    answer: "Delay time is roughly flat: 1.38 million delay-minutes in 2014 vs 1.29 million in 2024, with bus delays down 16% while streetcar delays rose 49% and subway delays rose 82%.",
    sub: "1,240,037 delay incidents and 15.1 million delay-minutes across the TTC's subway, streetcar, and bus networks, unified on one cause taxonomy from 2014-01-01 to 2026-08-31. The TTC, Toronto's transit agency, changed its delay-coding scheme in 2025 and published no crosswalk between the old and new codes, so every time series died at the break. This is the editorial, versioned crosswalk v1 that bridges it.",
    cta1: "Explore the crosswalk",
    cta2: "Read the methodology",
    statsLabels: [
      "delay incidents cleaned and crosswalked, 2014-01-01 to 2026-08-31",
      "delay-minutes across subway, streetcar, and bus",
      "crosswalk rows mapping every observed cause code to 8 categories",
      "of incident rows map at high or medium confidence (99.3%)",
    ],
  },
  trend: {
    kicker: "The trend",
    title: "Better or worse? Roughly flat, but the mix changed.",
    body: "Total TTC delay time fell 6% between 2014 (1,376,820 minutes) and 2024 (1,289,281 minutes). The flat total hides a split: bus delay time fell 16%, streetcar delay time rose 49% (140,112 to 208,998 minutes), and subway delay time rose 82% (39,625 to 72,087 minutes). The 2025 figure, 1,363,898 minutes, is the first full year on the new codes, so comparisons across the 2025 code break are approximate. 2026 is partial, January through August.",
    chartNote: "Unified with crosswalk v1. 2026 is partial (Jan-Aug). Coverage 2014-01-01 to 2026-08-31; pulled 2026-10-09.",
    legend: { bus: "Bus", streetcar: "Streetcar", subway: "Subway" },
    yAxis: "Delay-minutes",
    built: "This chart exists only because crosswalk v1 maps the 2025+ alphanumeric codes onto the same 8 categories as the 2014-2024 records. No TTC-published crosswalk exists.",
  },
  bubbles: {
    kicker: "Frequency vs severity",
    title: "Where a dollar of intervention buys the most.",
    body: "Operations/Crew dominates total time lost: 7.76 million minutes (129,346 hours) across 471,501 incidents, at 16.5 minutes each. Collision is the opposite corner: only 28,712 incidents, but the worst per incident at 19.2 minutes. Mechanical is the second-largest bucket at 3.65 million minutes. Track/Overhead is cheapest per incident, 4.6 minutes, but strikes 61,143 times.",
    xAxis: "Average minutes per incident",
    yAxis: "Total hours lost",
    sizeNote: "Bubble area scales with incident count. Vintage: 2014-01-01 to 2026-08-31.",
  },
  fingerprints: {
    kicker: "Failure fingerprints",
    title: "Two systems, same agency, different failures.",
    body: "Streetcars are delayed by the streets they run in: Operations/Crew is 49.3% of streetcar delay-minutes (diversions, traffic blocking the rail), Mechanical 18.1%, Security 13.4%. Subways run underground but are delayed by people: Security is 25.1% of subway delay-minutes (disorderly patrons, police), Track/Overhead 16.7%, Emergency/Medical 16.0%, Operations/Crew 16.0%. Buses look like streetcars without rails: Operations/Crew 53.7%, Mechanical 26.0%.",
    foulTitle: "One claim fails verification",
    foulBody: "Streetcars do not lose more time to cars parked on the tracks than to mechanical breakdowns. Auto-foul-rail codes total 36,728 minutes across 1,394 incidents; Mechanical totals 400,253 minutes across 47,547 incidents, roughly 11 times larger.",
    disorderlyTitle: "Disorderly patrons peak at 5 PM",
    disorderlyBody: "Subway code SUDP (the TTC code for a disorderly patron) peaks at 5 PM with 1,398 incidents in hour 17, not late at night. The 6 PM to 8 PM window is nearly as high.",
    vintage: "Delay-minute shares, 2014-01-01 to 2026-08-31.",
  },
  lines: {
    kicker: "Subway lines",
    title: "Line 1 carries half the subway's delay time.",
    body: "Over the full 2014-2026 series, Line 1 (Yonge-University) accounts for 50.5% of subway delay-minutes (333,979), Line 2 (Bloor-Danforth) 39.4% (260,533), Line 3 (Scarborough) 6.0%, and Line 4 (Sheppard) 4.0%.",
    caveatTitle: "The missing denominator",
    caveatBody: "No public ridership denominator exists, so per-rider delay rates cannot be computed. Delay-minutes are not passenger-minutes, and line shares are not per-rider shares.",
    vintage: "Full series, 2014-01-01 to 2026-08-31. Pulled 2026-10-09.",
  },
  timing: {
    kicker: "Timing",
    title: "When delays happen.",
    hourTitle: "Hour of day, by cause category",
    hourBody: "Incidents per hour. Security incidents concentrate in the evening across all modes; subway disorderly-patron incidents peak at 5 PM.",
    weekdayTitle: "Day of week, by cause category",
    weekdayBody: "Average minutes per incident. Sunday incidents average 13.8 minutes, about 14% longer than Friday's 12.1. Saturday averages 13.0.",
    vintage: "All modes, 2014-01-01 to 2026-08-31.",
    hours: "Incidents",
    avgMin: "Avg min/incident",
  },
  crosswalk: {
    kicker: "The crosswalk",
    title: "The code break, audited row by row.",
    body: "539 rows map every observed cause code onto 8 categories. 271 rows come from the TTC's own code-description tables, 71 from the TTC's legacy subway code table, 58 are direct matches on the 2024-era plain-language labels, 45 come from another mode's official table, and 94 are pattern-matched to codes the TTC's tables do not cover. Pattern-matched rows are flagged below. 99.3% of incident rows map at high or medium confidence; 8,618 rows (0.7%) rest on pattern matching. No TTC-published crosswalk exists; this one is editorial and versioned.",
    breaksTitle: "Two breaks, not one",
    breaksBody: "The subway switched code schemes around 2018-2024: legacy codes are mapped from the TTC's own legacy table, not guessed. The 2025 break affects streetcar and bus. The subway never used plain-language categories; its 2014-2024 files always carried codes.",
    flagTitle: "Sensitivity flag",
    flagBody: "Streetcar Track/Overhead jumps from 1.4% of 2024 delay-minutes to 15.7% in 2025 while Mechanical falls 8.1% to 3.6%. Part of that jump may be crosswalk sensitivity at the break, not a real change. Year-over-year comparisons across the break are approximate.",
    search: "Search by code, description, or category…",
    mode: "Mode",
    allModes: "All modes",
    results: "crosswalk rows",
    headers: { code: "Code", description: "Official description", category: "Category", method: "Method", confidence: "Confidence", note: "Note", incidents: "Incidents", minutes: "Minutes" },
    methodLabels: {
      official: "official table",
      "official-legacy": "TTC legacy table",
      "direct-label": "plain-label era",
      "cross-mode-official": "other mode's table",
      pattern: "pattern match",
    },
    patternFlag: "pattern-matched, unofficial",
    vintage: "Crosswalk v1. Vintage: pulled 2026-10-09.",
  },
  caveats: {
    kicker: "Honest caveats",
    title: "What this does not show.",
    items: [
      "No ridership denominators exist in public data, so per-rider delay rates cannot be computed. This applies next to every line and route comparison.",
      "The TTC logs a single primary cause per incident; a delay with two causes appears once.",
      "Delays under 1 minute are not consistently logged. 221,620 zero-minute rows were kept and flagged: the subway logs zero minutes on 65% of incidents (a stable TTC convention, not a data error), streetcars 22.0% in 2025+, buses 12.4%. Zero-minute rows count toward incidents, not minutes.",
      "The 2024-to-2025 crosswalk is editorial, not official. Year-over-year comparisons across the break are approximate; the explorer above shows exactly how each code was mapped.",
      "Coverage is 2014-01-01 to 2026-08-31. 2026 is partial, January through August. The 2025+ files are rolling and the portal refreshes them: portal refresh 2026-09-21, data pulled 2026-10-09.",
    ],
  },
  methodology: {
    kicker: "Methodology",
    title: "How the taxonomy was built.",
    sourcesTitle: "Sources",
    sourcesBody: "All three datasets are City of Toronto Open Data under the Open Government Licence - Toronto, pulled 2026-10-09 (portal last refreshed 2026-09-21): TTC Subway Delay Data, TTC Streetcar Delay Data, and TTC Bus Delay Data. Resources were enumerated with the CKAN catalog API (package_show on each dataset slug); exact resource IDs and pull dates are in resource_meta.json in the repo.",
    joinedTitle: "What was joined",
    joinedBody: "Subway: yearly XLSX files 2014-2024 (12 monthly sheets each) plus the rolling 'TTC Subway Delay Data since 2025' CSV. Streetcar and bus: yearly XLSX 2014-2024 plus the rolling 2025+ CSVs. The official code-description tables were joined first: 140 subway codes, the TTC legacy subway table of 71 codes, 85 streetcar codes, 46 bus codes. Prior-art articles at opendatacanada.ca were methodology reference only; every number was recomputed from the raw files.",
    normalizedTitle: "What was normalized",
    normalizedBody: "Monthly-sheet column renames (Gap/Delay, Incident ID), the bus/streetcar Route/Line vs subway Line/Bound difference, and 117 subway station spelling variants normalized to canonical names (2,099 rows, e.g. DANFORT to DANFORTH). One incident-level table results: date, time, mode, line/route, station/location, raw cause code, crosswalked cause category, delay minutes, day of week, hour.",
    leftoutTitle: "What was left out",
    leftoutBody: "Dropped rows: streetcar/bus Line placeholders of 999 or 500 (1,752 rows), Min Delay of exactly 999 as a data-entry cap (1,235), Min Delay over 300 minutes (5,391), negative Min Delay (10). Zero-minute rows were kept but flagged (221,620). Raw rows ingested: 1,248,435. Cleaned rows: 1,240,037.",
    computationTitle: "Exact computation",
    computationBody: "Delay-minutes are summed per row of the cleaned incident table; incident counts count rows. Average minutes per incident is total delay-minutes divided by incident count. Category shares are category delay-minutes divided by the mode total. Line shares are line delay-minutes divided by the subway total. All aggregates are published in data/aggregates/; the export script scripts/export_site_data.py reproduces every figure on this page from them.",
    crosswalkTitle: "Crosswalk v1",
    crosswalkBody: "539 rows, methods official 271, official-legacy 71, direct-label 58, cross-mode-official 45, pattern 94; confidence high 416, medium 67, low 56. By incident rows, 99.3% map at high or medium confidence; 8,618 rows (0.7%) rest on pattern matching; zero rows are unmapped. No TTC-published crosswalk exists; this one is editorial and versioned.",
    builtLine: "Built October 2026 from City of Toronto open data.",
  },
  developers: {
    kicker: "For developers",
    title: "Query it from code, or from an agent.",
    body: "Three consumption paths, same canonical data. REST for applications, OpenAPI for integration, MCP tools over streamable HTTP for AI agents.",
    endpoints: "Endpoints",
    tryIt: "Try it",
    openapi: "OpenAPI spec",
  },
  downloads: {
    kicker: "Data",
    title: "Take the files.",
    body: "Versioned releases, MIT licensed. CSV for spreadsheets, JSON for applications. All aggregates plus the editorial crosswalk v1.",
    files: [
      { name: "by_year_mode_category.csv", desc: "Delay minutes and incidents by year, mode, cause category" },
      { name: "frequency_severity_category.csv", desc: "Total minutes, incidents, average minutes per incident per category" },
      { name: "frequency_severity_code.csv", desc: "Same per (mode, cause code), with official descriptions" },
      { name: "by_line.csv", desc: "Subway lines by year and category" },
      { name: "by_hour.csv", desc: "Hour of day by mode and category" },
      { name: "by_weekday.csv", desc: "Day of week by mode and category" },
      { name: "crosswalk_v1.csv", desc: "The 539-row editorial crosswalk: code to category, method, confidence" },
      { name: "summary.json", desc: "Headline totals, vintage, and methodology notes" },
    ],
    download: "Download",
  },
  footer: {
    line: "An open-source civic project. Not affiliated with the Government of Canada or the City of Toronto.",
    built: "Built October 2026 by Richardson Dackam.",
    sources:
      "Sources: City of Toronto Open Data (TTC Subway Delay Data, TTC Streetcar Delay Data, TTC Bus Delay Data; Open Government Licence - Toronto). Coverage 2014-01-01 to 2026-08-31; portal refreshed 2026-09-21; pulled 2026-10-09.",
  },
  mcp: {
    kicker: "Connect your agent",
    title: "Put this data to work inside your AI tools.",
    body: "Pick your harness, copy the prompt, send it to your agent. Your agent runs the setup itself.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Other" },
    cardTitle: "Copy and send this to {tab}",
    copy: "Copy",
    copied: "Copied",
    chatgptNote: "ChatGPT connects through the documented REST API rather than MCP directly.",
    pChatgpt:
      "I want to use the {displayName} through its API.\n- OpenAPI spec: {origin}/api/openapi.json\n- REST base: {origin}/api/v1\nFirst tell me in two sentences what this API offers, then {exampleLower}, and show me the result.",
    pClaude:
      "In Claude (claude.ai), open Settings, then Connectors, and add a custom connector:\n- Name: {displayName}\n- URL: {origin}/mcp\nThen list the available tools, {exampleLower}, and show me the result.",
    pClaudeCode:
      "Set up the {displayName} MCP server so I can query it from here.\n1. Run: claude mcp add --transport http {slug} {origin}/mcp\n2. Run `claude mcp list` to confirm it connected.\n3. {example}, and show me the result.",
    pCli:
      "# MCP endpoint (streamable HTTP)\n{origin}/mcp\n\n# List the available tools\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Everything else",
    otherBody: "Any harness that speaks MCP over streamable HTTP, or plain REST.",
    mcpEndpoint: "MCP endpoint",
    openapiSpec: "OpenAPI spec",
    restBase: "REST base",
  },
};

export type Dict = typeof en;

const fr: Dict = {
  banner: {
    line: "Un projet civique à code source ouvert. Sans affiliation avec le gouvernement du Canada ni la Ville de Toronto.",
    badge: "Code source ouvert",
  },
  nav: {
    trend: "Tendance",
    bubbles: "Causes",
    fingerprints: "Signatures",
    lines: "Lignes",
    timing: "Horaire",
    crosswalk: "Correspondance",
    methodology: "Méthodologie",
    developers: "Développeurs",
    data: "Données",
    back: "Tous les projets",
  },
  hero: {
    kicker: "Nshipyard Canada · Analyse des retards de la TTC",
    title: "Chaque retard de la TTC depuis 2014, sur un seul graphique.",
    answer: "Le temps de retard est à peu près stable : 1,38 million de minutes de retard en 2014 contre 1,29 million en 2024, avec les retards de bus en baisse de 16 % tandis que ceux des tramways augmentaient de 49 % et ceux du métro de 82 %.",
    sub: "1 240 037 incidents de retard et 15,1 millions de minutes de retard dans les réseaux de métro, de tramway et de bus de la TTC, unifiés en une seule taxonomie des causes du 2014-01-01 au 2026-08-31. La TTC, l'agence de transport de Toronto, a changé son système de codes de retard en 2025 sans publier de table de correspondance, de sorte que toutes les séries chronologiques mouraient à la rupture. Voici la correspondance éditoriale versionnée v1 qui la comble.",
    cta1: "Explorer la correspondance",
    cta2: "Lire la méthodologie",
    statsLabels: [
      "incidents de retard nettoyés et classés, du 2014-01-01 au 2026-08-31",
      "minutes de retard en métro, tramway et bus",
      "lignes de correspondance reliant chaque code observé à 8 catégories",
      "des lignes d'incidents classées à confiance élevée ou moyenne (99,3 %)",
    ],
  },
  trend: {
    kicker: "La tendance",
    title: "Mieux ou pire ? À peu près stable, mais la composition a changé.",
    body: "Le temps total de retard de la TTC a baissé de 6 % entre 2014 (1 376 820 minutes) et 2024 (1 289 281 minutes). Ce total stable cache une division : les retards de bus ont baissé de 16 %, ceux des tramways ont augmenté de 49 % (140 112 à 208 998 minutes) et ceux du métro de 82 % (39 625 à 72 087 minutes). Le chiffre de 2025, 1 363 898 minutes, est la première année complète avec les nouveaux codes, donc les comparaisons à travers la rupture de 2025 sont approximatives. 2026 est partielle, de janvier à août.",
    chartNote: "Unifié avec la correspondance v1. 2026 est partielle (janv.-août). Couverture du 2014-01-01 au 2026-08-31; extrait le 2026-10-09.",
    legend: { bus: "Bus", streetcar: "Tramway", subway: "Métro" },
    yAxis: "Minutes de retard",
    built: "Ce graphique n'existe que parce que la correspondance v1 relie les codes alphanumériques de 2025+ aux mêmes 8 catégories que les dossiers 2014-2024. Aucune correspondance publiée par la TTC n'existe.",
  },
  bubbles: {
    kicker: "Fréquence contre gravité",
    title: "Où un dollar d'intervention rapporte le plus.",
    body: "Opérations/Équipage domine le temps total perdu : 7,76 millions de minutes (129 346 heures) sur 471 501 incidents, à 16,5 minutes chacun. Les collisions sont le coin opposé : seulement 28 712 incidents, mais les pires par incident à 19,2 minutes. La mécanique est le deuxième seau avec 3,65 millions de minutes. Voie/Aérien est le moins cher par incident, 4,6 minutes, mais frappe 61 143 fois.",
    xAxis: "Minutes moyennes par incident",
    yAxis: "Heures totales perdues",
    sizeNote: "La surface des bulles est proportionnelle au nombre d'incidents. Millésime : du 2014-01-01 au 2026-08-31.",
  },
  fingerprints: {
    kicker: "Signatures de panne",
    title: "Deux systèmes, même agence, des pannes différentes.",
    body: "Les tramways sont retardés par les rues où ils circulent : Opérations/Équipage représente 49,3 % de leurs minutes de retard (détours, circulation bloquant la voie), Mécanique 18,1 %, Sécurité 13,4 %. Les métros circulent sous terre mais sont retardés par les gens : la Sécurité représente 25,1 % de leurs minutes de retard (passagers perturbateurs, police), Voie/Aérien 16,7 %, Urgence/Médical 16,0 %, Opérations/Équipage 16,0 %. Les bus ressemblent aux tramways sans rails : Opérations/Équipage 53,7 %, Mécanique 26,0 %.",
    foulTitle: "Une affirmation échoue à la vérification",
    foulBody: "Les tramways ne perdent pas plus de temps à cause des voitures garées sur les voies qu'à cause des pannes mécaniques. Les codes d'encombrement de voie totalisent 36 728 minutes sur 1 394 incidents; la Mécanique totalise 400 253 minutes sur 47 547 incidents, soit environ 11 fois plus.",
    disorderlyTitle: "Les passagers perturbateurs culminent à 17 h",
    disorderlyBody: "Le code de métro SUDP (le code de la TTC pour un passager perturbateur) culmine à 17 h avec 1 398 incidents à l'heure 17, pas tard le soir. La plage de 18 h à 20 h est presque aussi élevée.",
    vintage: "Parts des minutes de retard, du 2014-01-01 au 2026-08-31.",
  },
  lines: {
    kicker: "Lignes de métro",
    title: "La ligne 1 porte la moitié du temps de retard du métro.",
    body: "Sur toute la série 2014-2026, la ligne 1 (Yonge-University) représente 50,5 % des minutes de retard du métro (333 979), la ligne 2 (Bloor-Danforth) 39,4 % (260 533), la ligne 3 (Scarborough) 6,0 % et la ligne 4 (Sheppard) 4,0 %.",
    caveatTitle: "Le dénominateur manquant",
    caveatBody: "Aucun dénominateur d'achalandage public n'existe, donc aucun taux de retard par usager ne peut être calculé. Les minutes de retard ne sont pas des minutes-passagers, et les parts par ligne ne sont pas des parts par usager.",
    vintage: "Série complète, du 2014-01-01 au 2026-08-31. Extrait le 2026-10-09.",
  },
  timing: {
    kicker: "Horaire",
    title: "Quand les retards surviennent.",
    hourTitle: "Heure du jour, par catégorie de cause",
    hourBody: "Incidents par heure. Les incidents de sécurité se concentrent le soir dans tous les modes; les incidents de passagers perturbateurs du métro culminent à 17 h.",
    weekdayTitle: "Jour de la semaine, par catégorie de cause",
    weekdayBody: "Minutes moyennes par incident. Les incidents du dimanche durent en moyenne 13,8 minutes, environ 14 % de plus que les 12,1 du vendredi. Le samedi affiche 13,0 en moyenne.",
    vintage: "Tous les modes, du 2014-01-01 au 2026-08-31.",
    hours: "Incidents",
    avgMin: "Min moy./incident",
  },
  crosswalk: {
    kicker: "La correspondance",
    title: "La rupture de codes, vérifiée ligne par ligne.",
    body: "539 lignes relient chaque code de cause observé à 8 catégories. 271 lignes viennent des propres tables de description de codes de la TTC, 71 de sa table de codes hérités du métro, 58 sont des correspondances directes avec les libellés en langage clair de l'ère 2024, 45 viennent de la table officielle d'un autre mode, et 94 sont appariées par motifs à des codes que les tables de la TTC ne couvrent pas. Les lignes appariées par motifs sont signalées ci-dessous. 99,3 % des lignes d'incidents sont classées à confiance élevée ou moyenne; 8 618 lignes (0,7 %) reposent sur l'appariement par motifs. Aucune correspondance publiée par la TTC n'existe; celle-ci est éditoriale et versionnée.",
    breaksTitle: "Deux ruptures, pas une",
    breaksBody: "Le métro a changé de système de codes vers 2018-2024 : les codes hérités sont reliés à partir de la propre table héritée de la TTC, pas devinés. La rupture de 2025 touche le tramway et le bus. Le métro n'a jamais utilisé de catégories en langage clair; ses dossiers 2014-2024 ont toujours porté des codes.",
    flagTitle: "Alerte de sensibilité",
    flagBody: "La part Voie/Aérien des tramways passe de 1,4 % des minutes de retard de 2024 à 15,7 % en 2025 tandis que la Mécanique chute de 8,1 % à 3,6 %. Une partie de ce bond peut venir de la sensibilité de la correspondance à la rupture, pas d'un vrai changement. Les comparaisons annuelles à travers la rupture sont approximatives.",
    search: "Rechercher par code, description ou catégorie…",
    mode: "Mode",
    allModes: "Tous les modes",
    results: "lignes de correspondance",
    headers: { code: "Code", description: "Description officielle", category: "Catégorie", method: "Méthode", confidence: "Confiance", note: "Note", incidents: "Incidents", minutes: "Minutes" },
    methodLabels: {
      official: "table officielle",
      "official-legacy": "table héritée TTC",
      "direct-label": "ère des libellés clairs",
      "cross-mode-official": "table d'un autre mode",
      pattern: "appariement par motifs",
    },
    patternFlag: "apparié par motifs, non officiel",
    vintage: "Correspondance v1. Millésime : extrait le 2026-10-09.",
  },
  caveats: {
    kicker: "Mises en garde honnêtes",
    title: "Ce que ceci ne montre pas.",
    items: [
      "Aucun dénominateur d'achalandage n'existe dans les données publiques, donc aucun taux de retard par usager ne peut être calculé. Cela s'applique à côté de chaque comparaison de ligne et de parcours.",
      "La TTC consigne une seule cause principale par incident; un retard à deux causes n'apparaît qu'une fois.",
      "Les retards de moins d'une minute ne sont pas consignés de façon uniforme. 221 620 lignes à zéro minute ont été conservées et signalées : le métro consigne zéro minute sur 65 % des incidents (une convention stable de la TTC, pas une erreur de données), les tramways 22,0 % en 2025+, les bus 12,4 %. Les lignes à zéro minute comptent dans les incidents, pas dans les minutes.",
      "La correspondance 2024-2025 est éditoriale, pas officielle. Les comparaisons annuelles à travers la rupture sont approximatives; l'explorateur ci-dessus montre exactement comment chaque code a été relié.",
      "La couverture va du 2014-01-01 au 2026-08-31. 2026 est partielle, de janvier à août. Les fichiers 2025+ sont roulants et le portail les actualise : actualisation du portail le 2026-09-21, données extraites le 2026-10-09.",
    ],
  },
  methodology: {
    kicker: "Méthodologie",
    title: "Comment la taxonomie a été construite.",
    sourcesTitle: "Sources",
    sourcesBody: "Les trois jeux de données sont des données ouvertes de la Ville de Toronto sous la Licence du gouvernement ouvert - Toronto, extraits le 2026-10-09 (portail actualisé le 2026-09-21) : TTC Subway Delay Data, TTC Streetcar Delay Data et TTC Bus Delay Data. Les ressources ont été énumérées avec l'API du catalogue CKAN (package_show sur chaque identifiant de jeu); les identifiants exacts de ressources et les dates d'extraction sont dans resource_meta.json du dépôt.",
    joinedTitle: "Ce qui a été joint",
    joinedBody: "Métro : fichiers XLSX annuels 2014-2024 (12 feuilles mensuelles chacun) plus le CSV roulant « TTC Subway Delay Data since 2025 ». Tramway et bus : XLSX annuels 2014-2024 plus les CSV roulants 2025+. Les tables officielles de description de codes ont été jointes en premier : 140 codes de métro, la table héritée de la TTC de 71 codes de métro, 85 codes de tramway, 46 codes de bus. Les articles antérieurs d'opendatacanada.ca n'ont servi que de référence méthodologique; chaque nombre a été recalculé à partir des fichiers bruts.",
    normalizedTitle: "Ce qui a été normalisé",
    normalizedBody: "Renommages de colonnes entre feuilles mensuelles (Gap/Delay, Incident ID), la différence Route/Line bus-tramway contre Line/Bound du métro, et 117 variantes orthographiques de noms de stations de métro normalisées vers des noms canoniques (2 099 lignes, ex. DANFORT vers DANFORTH). Il en résulte une table d'incidents : date, heure, mode, ligne/parcours, station/lieu, code de cause brut, catégorie de cause, minutes de retard, jour de semaine, heure.",
    leftoutTitle: "Ce qui a été exclu",
    leftoutBody: "Lignes abandonnées : substituts de ligne 999 ou 500 pour tramway/bus (1 752 lignes), Min Delay d'exactement 999 comme plafond de saisie (1 235), Min Delay au-delà de 300 minutes (5 391), Min Delay négatif (10). Les lignes à zéro minute ont été conservées mais signalées (221 620). Lignes brutes ingérées : 1 248 435. Lignes nettoyées : 1 240 037.",
    computationTitle: "Calcul exact",
    computationBody: "Les minutes de retard sont sommées par ligne de la table d'incidents nettoyée; les comptes d'incidents comptent les lignes. La moyenne de minutes par incident est le total des minutes de retard divisé par le compte d'incidents. Les parts par catégorie sont les minutes de retard de la catégorie divisées par le total du mode. Les parts par ligne sont les minutes de retard de la ligne divisées par le total du métro. Tous les agrégats sont publiés dans data/aggregates/; le script scripts/export_site_data.py reproduit chaque chiffre de cette page à partir d'eux.",
    crosswalkTitle: "Correspondance v1",
    crosswalkBody: "539 lignes, méthodes : officielle 271, officielle-héritée 71, libellé direct 58, officielle d'un autre mode 45, motifs 94; confiance : élevée 416, moyenne 67, faible 56. Par lignes d'incidents, 99,3 % sont classées à confiance élevée ou moyenne; 8 618 lignes (0,7 %) reposent sur l'appariement par motifs; zéro ligne non classée. Aucune correspondance publiée par la TTC n'existe; celle-ci est éditoriale et versionnée.",
    builtLine: "Construit en octobre 2026 à partir des données ouvertes de la Ville de Toronto.",
  },
  developers: {
    kicker: "Pour les développeurs",
    title: "Interrogez-la depuis du code, ou depuis un agent.",
    body: "Trois façons de consommer les mêmes données canoniques. REST pour les applications, OpenAPI pour l'intégration, outils MCP en HTTP continu pour les agents IA.",
    endpoints: "Points de terminaison",
    tryIt: "Essayer",
    openapi: "Spécification OpenAPI",
  },
  downloads: {
    kicker: "Données",
    title: "Prenez les fichiers.",
    body: "Versions numérotées, licence MIT. CSV pour les tableurs, JSON pour les applications. Tous les agrégats plus la correspondance éditoriale v1.",
    files: [
      { name: "by_year_mode_category.csv", desc: "Minutes de retard et incidents par année, mode, catégorie de cause" },
      { name: "frequency_severity_category.csv", desc: "Minutes totales, incidents, moyenne par incident et par catégorie" },
      { name: "frequency_severity_code.csv", desc: "Idem par (mode, code de cause), avec descriptions officielles" },
      { name: "by_line.csv", desc: "Lignes de métro par année et catégorie" },
      { name: "by_hour.csv", desc: "Heure du jour par mode et catégorie" },
      { name: "by_weekday.csv", desc: "Jour de la semaine par mode et catégorie" },
      { name: "crosswalk_v1.csv", desc: "La correspondance éditoriale de 539 lignes : code vers catégorie, méthode, confiance" },
      { name: "summary.json", desc: "Totaux principaux, millésime et notes de méthodologie" },
    ],
    download: "Télécharger",
  },
  footer: {
    line: "Un projet civique à code source ouvert. Sans affiliation avec le gouvernement du Canada ni la Ville de Toronto.",
    built: "Construit en octobre 2026 par Richardson Dackam.",
    sources:
      "Sources : Données ouvertes de la Ville de Toronto (TTC Subway Delay Data, TTC Streetcar Delay Data, TTC Bus Delay Data; Licence du gouvernement ouvert - Toronto). Couverture du 2014-01-01 au 2026-08-31; portail actualisé le 2026-09-21; extrait le 2026-10-09.",
  },
  mcp: {
    kicker: "Connectez votre agent",
    title: "Exploitez ces données dans vos outils d'IA.",
    body: "Choisissez votre plateforme, copiez l'invite, envoyez-la à votre agent. Votre agent exécute la configuration lui-même.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Autre" },
    cardTitle: "Copiez et envoyez ceci à {tab}",
    copy: "Copier",
    copied: "Copié",
    chatgptNote: "ChatGPT se connecte via l'API REST documentée plutôt que directement en MCP.",
    pChatgpt:
      "Je veux utiliser {displayName} via son API.\n- Spécification OpenAPI : {origin}/api/openapi.json\n- Base REST : {origin}/api/v1\nD'abord, dis-moi en deux phrases ce que cette API offre, puis {exampleLower}, et montre-moi le résultat.",
    pClaude:
      "Dans Claude (claude.ai), ouvre les paramètres, puis Connecteurs, et ajoute un connecteur personnalisé :\n- Nom : {displayName}\n- URL : {origin}/mcp\nEnsuite, liste les outils disponibles, {exampleLower}, et montre-moi le résultat.",
    pClaudeCode:
      "Configure le serveur MCP {displayName} pour que je puisse l'interroger d'ici.\n1. Exécute : claude mcp add --transport http {slug} {origin}/mcp\n2. Exécute `claude mcp list` pour confirmer la connexion.\n3. {example}, et montre-moi le résultat.",
    pCli:
      "# Point de terminaison MCP (HTTP continu)\n{origin}/mcp\n\n# Lister les outils disponibles\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Tout le reste",
    otherBody: "Toute plateforme qui parle MCP en HTTP continu, ou REST tout court.",
    mcpEndpoint: "Point de terminaison MCP",
    openapiSpec: "Spécification OpenAPI",
    restBase: "Base REST",
  },
};

const dicts: Record<Lang, Dict> = { en, fr };

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "en",
  setLang: () => {},
  t: en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t: dicts[lang] }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
