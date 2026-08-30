#!/usr/bin/env python3
"""
sync-graphify.py — PlantNeeds vault
====================================
Keeps the Graphify knowledge graph (.graphify/graph.json) in sync with the
Obsidian vault's markdown [[wiki-links]].

Single source of truth: the .md files' wiki-links.
This script derives BOTH graphs from them, so Obsidian Graph View and Graphify
always describe the same documentation network.

Usage:
    python scripts/sync-graphify.py          # regenerate graph + manifest
    python scripts/sync-graphify.py --check  # report only, don't write

Run after adding / renaming / deleting any .md file, or editing links.
Never hand-edit .graphify/graph.json — regenerate it instead.
"""
import json, re, sys, hashlib, argparse
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
EXCLUDE_DIRS = {'.obsidian', '.graphify', 'node_modules', '.git', 'src', 'dist'}

# community assignment by top-level folder (mirrors docs/graph-sync.md)
COMMUNITIES = {'': 0, 'docs': 1, 'tasks': 2, 'canvas': 3}
COMMUNITY_NAMES = {0: 'Core documents', 1: 'Deep-dive docs', 2: 'Working notes', 3: 'Visual maps'}

WIKILINK_RE = re.compile(r'\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]')

def find_md_files():
    files = []
    for p in sorted(VAULT.rglob('*.md')):
        rel = p.relative_to(VAULT)
        if any(part in EXCLUDE_DIRS for part in rel.parts):
            continue
        files.append(rel)
    return files

def note_id(rel_path):
    """Obsidian-style note name: path without .md, posix separators."""
    return str(rel_path.with_suffix('')).replace('\\', '/')

def parse_links(md_path, all_ids):
    """Extract resolved wiki-link targets from a markdown file.
    Links inside inline code spans (`...`) are treated as prose examples, not links."""
    text = md_path.read_text(encoding='utf-8')
    text = re.sub(r'`[^`\n]*`', '', text)  # strip inline code before link parsing
    targets = []
    for raw in WIKILINK_RE.findall(text):
        target = raw.strip()
        # resolve: exact path match, basename match, or same-folder match
        if target in all_ids:
            targets.append(target); continue
        matches = [i for i in all_ids if i.split('/')[-1] == target.split('/')[-1]]
        if matches:
            targets.append(matches[0])
        else:
            targets.append(f'__BROKEN__{target}')
    return targets

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='report only')
    args = ap.parse_args()

    md_files = find_md_files()
    all_ids = [note_id(f) for f in md_files]
    id_to_path = dict(zip(all_ids, md_files))

    nodes, links, broken, linked = [], [], [], set()
    for nid_, rel in id_to_path.items():
        folder = rel.parts[0] if len(rel.parts) > 1 else ''
        comm = COMMUNITIES.get(folder, 0)
        nodes.append({
            'id': nid_,
            'label': rel.name,
            'file_type': 'doc',
            'source_file': str(rel).replace('\\', '/'),
            'community': comm,
            'community_name': COMMUNITY_NAMES[comm],
        })
        for tgt in parse_links(VAULT / rel, all_ids):
            if tgt.startswith('__BROKEN__'):
                broken.append((nid_, tgt.replace('__BROKEN__', ''))); continue
            if tgt == nid_:
                continue
            links.append({'source': nid_, 'target': tgt, 'relation': 'links_to',
                          'confidence': 'EXTRACTED', 'weight': 1})
            linked.add(nid_); linked.add(tgt)

    orphans = [n['id'] for n in nodes if n['id'] not in linked]

    graph = {
        'directed': True,
        'multigraph': False,
        'graph': {'community_labels': COMMUNITY_NAMES,
                  'description': 'PlantNeeds documentation knowledge graph. '
                                 'Derived from Obsidian [[wiki-links]] by scripts/sync-graphify.py. '
                                 'Do not hand-edit; regenerate.'},
        'nodes': nodes,
        'links': links,
        'hyperedges': [],
    }
    manifest = {}
    for rel in md_files:
        p = VAULT / rel
        manifest[str(p)] = {
            'mtime': p.stat().st_mtime * 1000,
            'hash': hashlib.md5(p.read_bytes()).hexdigest(),
        }

    print(f'📊 PlantNeeds vault graph')
    print(f'   notes (nodes):  {len(nodes)}')
    print(f'   wiki-links:     {len(links)}')
    print(f'   communities:    {len(set(n["community"] for n in nodes))} {COMMUNITY_NAMES}')
    if orphans:
        print(f'   ⚠️  orphan notes (no links): {orphans}')
    if broken:
        print(f'   ❌ broken links:')
        for src, tgt in broken: print(f'      {src} -> [[{tgt}]]')

    if args.check:
        print('   (--check mode: nothing written)')
        return 1 if broken else 0

    gdir = VAULT / '.graphify'
    gdir.mkdir(exist_ok=True)
    (gdir / 'graph.json').write_text(json.dumps(graph, indent=1), encoding='utf-8')
    (gdir / 'manifest.json').write_text(json.dumps(manifest, indent=1), encoding='utf-8')
    print(f'   ✅ wrote .graphify/graph.json + manifest.json')
    return 1 if broken else 0

if __name__ == '__main__':
    sys.exit(main())
