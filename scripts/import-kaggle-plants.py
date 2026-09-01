import urllib.request, zipfile, io, json, csv, re

token = 'KGAT_cff475dcab7902d66d32786773710f8d'
headers = {'Authorization': f'Bearer {token}'}

print('Downloading FloraDB from Kaggle...')
req1 = urllib.request.Request('https://www.kaggle.com/api/v1/datasets/download/ahtiticheamine/floradb-houseplants-care-sample', headers=headers)
with urllib.request.urlopen(req1) as res:
    z1 = zipfile.ZipFile(io.BytesIO(res.read()))
    with z1.open('floradb_sample.csv') as f:
        floradb = list(csv.DictReader(io.TextIOWrapper(f, 'utf-8')))

print('Downloading Companion Plants from Kaggle...')
req2 = urllib.request.Request('https://www.kaggle.com/api/v1/datasets/download/aramacus/companion-plants', headers=headers)
with urllib.request.urlopen(req2) as res:
    z2 = zipfile.ZipFile(io.BytesIO(res.read()))
    with z2.open('companion_plants.csv') as f:
        companions_raw = list(csv.DictReader(io.TextIOWrapper(f, 'utf-8')))

# Build companion lookup from dataset
companion_map = {}
enemy_map = {}
for r in companions_raw:
    src = r['Source Node'].lower().strip()
    dest = r['Destination Node'].lower().strip()
    link = r['Link'].lower().strip()
    if 'help' in link or 'attract' in link:
        companion_map.setdefault(src, set()).add(dest)
    elif 'harm' in link or 'inhibit' in link or 'bad' in link or 'avoid' in link:
        enemy_map.setdefault(src, set()).add(dest)

def map_light(light_str):
    ls = (light_str or '').lower()
    if 'low' in ls: return 'low'
    if 'direct' in ls or 'full' in ls: return 'direct'
    if 'bright' in ls: return 'bright_indirect'
    return 'medium'

id_aliases = {
    'monstera deliciosa': ['monstera', 'janda bolong besar', 'swiss cheese plant'],
    'epipremnum aureum': ['pothos', 'sirih gading', 'devil\'s ivy', 'golden pothos'],
    'sansevieria trifasciata': ['snake plant', 'lidah mertua', 'sansevieria'],
    'spathiphyllum wallisii': ['peace lily', 'sepatu filum', 'spathiphyllum'],
    'ficus lyrata': ['fiddle leaf fig', 'ketapang biola', 'ficus lyrata'],
    'chlorophytum comosum': ['spider plant', 'lili paris', 'airplane plant'],
    'aloe vera': ['aloe vera', 'lidah buaya', 'aloe'],
    'nephrolepis exaltata': ['boston fern', 'pakis boston', 'paku pedang'],
    'ocimum basilicum': ['basil', 'kemangi', 'selasih', 'sweet basil'],
    'capsicum annuum': ['pepper', 'cabai', 'lombok', 'chili', 'bell pepper'],
    'solanum lycopersicum': ['tomato', 'tomat', 'garden tomato'],
    'cucumis sativus': ['cucumber', 'timun', 'mentimun'],
    'lactuca sativa': ['lettuce', 'selada'],
    'daucus carota': ['carrot', 'wortel'],
    'spinacia oleracea': ['spinach', 'bayam'],
    'phaseolus vulgaris': ['green bean', 'buncis', 'kacang buncis'],
    'zea mays': ['corn', 'jagung', 'sweet corn'],
    'cucurbita pepo': ['zucchini', 'labu jepang', 'courgette'],
    'allium cepa': ['onion', 'bawang', 'bawang merah', 'bawang bombay'],
    'solanum tuberosum': ['potato', 'kentang'],
    'mentha spicata': ['mint', 'daun mint', 'spearmint'],
    'helianthus annuus': ['sunflower', 'bunga matahari'],
    'tagetes erecta': ['marigold', 'bunga tai ayam', 'gemitir', 'marigold']
}

plants_db = {}

# Process FloraDB Real Houseplants
for row in floradb:
    sci = row['scientific_name'].strip()
    key = re.sub(r'[^a-z0-9]+', '_', sci.lower()).strip('_')
    if not key or key in plants_db: continue
    
    c_name = row['common_name'].strip() or sci
    water_days = int(row['watering_frequency_days']) if row.get('watering_frequency_days') and row['watering_frequency_days'].isdigit() else 7
    hum = int(row['ideal_humidity_percent']) if row.get('ideal_humidity_percent') and row['ideal_humidity_percent'].isdigit() else 50
    
    aliases = list(set([c_name.lower(), sci.lower(), key] + id_aliases.get(sci.lower(), [])))
    if row.get('vernacular_names_en'):
        for v in row['vernacular_names_en'].split(';'):
            v_clean = v.strip().lower()
            if v_clean and len(v_clean) > 2: aliases.append(v_clean)

    plants_db[key] = {
        'common_name': c_name,
        'scientific_name': sci,
        'aliases': sorted(list(set(aliases))),
        'type': 'indoor',
        'water_frequency_days': water_days,
        'light': map_light(row.get('light_requirement_level')),
        'ideal_humidity_percent': hum,
        'min_temp_celsius': float(row['min_temp_celsius']) if row.get('min_temp_celsius') else 15.0,
        'max_temp_celsius': float(row['max_temp_celsius']) if row.get('max_temp_celsius') else 30.0,
        'tips': f'Prefers {map_light(row.get("light_requirement_level"))} light and ~{hum}% humidity. Native range: {row.get("native_range", "Tropical").split(";")[0]}.',
        'image_url': row.get('image_url') or ''
    }

# Process Real Outdoor Crops & Garden Vegetables
outdoor_crops = [
    ('solanum_lycopersicum', 'Solanum lycopersicum', 'Tomato', ['tomato', 'tomat'], 1.5, 'direct', 70, 6, ['basil', 'marigold', 'alliums'], ['fennel', 'potato', 'corn'], 'Stake or cage plants. Provide consistent moisture to prevent blossom end rot.'),
    ('ocimum_basilicum', 'Ocimum basilicum', 'Basil', ['basil', 'kemangi'], 1.0, 'direct', 30, 4, ['tomatoes', 'peppers', 'marigold'], ['rue'], 'Pinch flower buds to prolong leaf harvest.'),
    ('capsicum_annuum', 'Capsicum annuum', 'Pepper', ['pepper', 'cabai', 'chili'], 1.5, 'direct', 70, 8, ['basil', 'tomatoes', 'onions'], ['fennel', 'kohlrabi'], 'Needs warm soil and consistent moisture.'),
    ('cucumis_sativus', 'Cucumis sativus', 'Cucumber', ['cucumber', 'timun'], 1.5, 'direct', 55, 4, ['beans', 'corn', 'radish'], ['potato', 'aromatic herbs'], 'Trellis vines to save garden space and keep fruit clean.'),
    ('lactuca_sativa', 'Lactuca sativa', 'Lettuce', ['lettuce', 'selada'], 1.0, 'medium', 45, 4, ['carrots', 'radish', 'strawberries'], [], 'Shallow roots require frequent light watering.'),
    ('daucus_carota', 'Daucus carota', 'Carrot', ['carrot', 'wortel'], 1.0, 'direct', 70, 3, ['lettuce', 'onions', 'rosemary'], ['fennel', 'dill'], 'Plant in deep, loose, stone-free soil.'),
    ('spinacia_oleracea', 'Spinacia oleracea', 'Spinach', ['spinach', 'bayam'], 1.0, 'medium', 40, 6, ['strawberries', 'peas'], [], 'Cool season crop. Harvest outer leaves continuously.'),
    ('phaseolus_vulgaris', 'Phaseolus vulgaris', 'Green Bean', ['green bean', 'buncis'], 1.0, 'direct', 55, 2, ['corn', 'cucumbers', 'potatoes'], ['onions', 'garlic'], 'Fixes nitrogen in soil. Avoid planting near alliums.'),
    ('zea_mays', 'Zea mays', 'Corn', ['corn', 'jagung'], 1.5, 'direct', 80, 2, ['beans', 'squash', 'cucumbers'], ['tomatoes'], 'Plant in dense blocks rather than single rows for wind pollination.'),
    ('allium_cepa', 'Allium cepa', 'Onion', ['onion', 'bawang'], 1.0, 'direct', 100, 6, ['carrots', 'beets', 'lettuce'], ['beans', 'peas'], 'Natural pest deterrent. Stop watering when tops fall over.'),
    ('solanum_tuberosum', 'Solanum tuberosum', 'Potato', ['potato', 'kentang'], 1.5, 'direct', 90, 4, ['beans', 'corn', 'marigold'], ['cucumbers', 'tomatoes', 'squash'], 'Hill soil around stems as foliage grows.'),
    ('mentha_spicata', 'Mentha spicata', 'Mint', ['mint', 'spearmint'], 1.0, 'medium', 60, 4, ['cabbage', 'tomatoes'], [], 'Vigorous spreader — best grown in containers.'),
    ('tagetes_erecta', 'Tagetes erecta', 'Marigold', ['marigold', 'gemitir'], 1.0, 'direct', 50, 4, ['tomatoes', 'peppers', 'cucumbers'], [], 'Excellent companion plant that repels nematodes and garden pests.')
]

for key, sci, c_name, aliases, water_in, light, harvest_d, frost_w, comp, enemy, tips in outdoor_crops:
    plants_db[key] = {
        'common_name': c_name,
        'scientific_name': sci,
        'aliases': sorted(list(set([c_name.lower(), sci.lower(), key] + aliases + id_aliases.get(sci.lower(), [])))),
        'type': 'outdoor_crop',
        'water_needs_inches_weekly': water_in,
        'water_frequency_days': 5 if water_in >= 1.5 else 7,
        'light': light,
        'days_to_harvest': harvest_d,
        'weeks_before_last_frost': frost_w,
        'companions': comp,
        'enemies': enemy,
        'tips': tips
    }

print(f'Total Real Species Compiled: {len(plants_db)}')

# Save canonical copies
with open('server/data/plants-db.json', 'w', encoding='utf-8') as f:
    json.dump(plants_db, f, indent=2)

with open('client/src/data/plants-db.json', 'w', encoding='utf-8') as f:
    json.dump(plants_db, f, indent=2)

print('Saved plants-db.json successfully to server and client.')
