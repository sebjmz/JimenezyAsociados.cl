#!/usr/bin/env python3
"""Genera vehiculos.html y las fichas de vehículos.
PRECIO: cambiar SOLO en public/data/vehiculos.json ("precio" y "precioNota") y re-ejecutar:
    python3 tools/build_vehiculos.py
"""
import json, os, html, urllib.parse
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/public/'
SITE = 'https://jimenezyasociados.cl/'
WA = '56951134778'
D = json.load(open(R + 'data/vehiculos.json'))
TPL = open(R + 'venta-depto-concon-3d-2b.html').read()
CSS = TPL[TPL.index('<style>'):TPL.index('</style>') + 8]
HEAD_ICONS = ''.join(l + '\n' for l in TPL.splitlines() if 'rel="icon"' in l or 'apple-touch-icon' in l)
NAV = '<nav><a href="propiedades.html">Propiedades</a><a href="arriendos.html">Arriendos</a><a href="vehiculos.html">Vehículos</a></nav>'
clp = lambda n: '$' + f'{n:,}'.replace(',', '.')
e = html.escape

def head(title, desc, url, img, ld):
    return f'''<!DOCTYPE html>
<html lang="es-CL">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{e(title)} | Jiménez &amp; Asociados</title>
    <meta name="description" content="{e(desc)}">
    <link rel="canonical" href="{url}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Jiménez & Asociados">
    <meta property="og:locale" content="es_CL">
    <meta property="og:title" content="{e(title)}">
    <meta property="og:description" content="{e(desc)}">
    <meta property="og:url" content="{url}">
    <meta property="og:image" content="{img}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{e(title)}">
    <meta name="twitter:description" content="{e(desc)}">
    <meta name="twitter:image" content="{img}">
{HEAD_ICONS}    <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
    {CSS}
    <style>.card{{display:block;background:#151517;border:1px solid #26262a;border-radius:16px;overflow:hidden;text-decoration:none}}.card img{{width:100%;height:auto;display:block;aspect-ratio:3/2;object-fit:cover}}.card div{{padding:14px}}.cards{{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin:18px 0}}.hero img.v{{aspect-ratio:4/3;max-width:calc(70vh * 1.333)}}</style>
</head>
<body>
<header><b><a href="/" style="text-decoration:none">JIMÉNEZ & ASOCIADOS</a></b>{NAV}</header>
'''

FOOT = '<footer>© 2026 Jiménez & Asociados Bienes Raíces · Reñaca, Concón, Viña del Mar y Santiago</footer>\n'

for v in D:
    s = v['slug']; url = SITE + s + '.html'; n = v['fotos']
    precio = clp(v['precio'])
    wa = f"https://wa.me/{WA}?text=" + urllib.parse.quote(f"Hola, me interesa el {v['nombre']} en venta ({precio}). ¿Cuándo lo puedo ver?")
    desc = f"{v['nombre']} en venta en {v['ubicacion']}: {v['km']:,} km".replace(',', '.') + f", {v['transmision'].lower()}, {v['combustible'].lower()}, un solo dueño. {precio}."
    imgs = [f'{SITE}img/{s}/{i:02d}.webp' for i in range(n)]
    ld = {"@context": "https://schema.org", "@type": ["Product", "Vehicle"], "@id": url + "#vehiculo", "name": v['nombre'],
          "brand": {"@type": "Brand", "name": v['marca']}, "model": v['modelo'], "vehicleModelDate": str(v['anio']),
          "mileageFromOdometer": {"@type": "QuantitativeValue", "value": v['km'], "unitCode": "KMT"},
          "vehicleTransmission": v['transmision'], "fuelType": v['combustible'], "numberOfPreviousOwners": 1,
          "itemCondition": "https://schema.org/UsedCondition", "bodyType": v['carroceria'], "image": imgs, "description": v['desc'],
          "offers": {"@type": "Offer", "price": v['precio'], "priceCurrency": "CLP", "availability": "https://schema.org/InStock",
                     "url": url, "areaServed": v['ubicacion'], "seller": {"@type": "RealEstateAgent", "name": "Jiménez & Asociados", "telephone": "+" + WA}}}
    feats = [(str(v['anio']), 'año'), (f"{v['km']:,}".replace(',', '.'), 'km'), (v['transmision'], 'transmisión'), (v['combustible'], 'combustible'), ('1', 'dueño'), (v['motor'], 'motor')]
    gal = ''.join(f'<a href="img/{s}/{i:02d}.webp"><img loading="{"eager" if i < 3 else "lazy"}" decoding="async" width="600" height="400" src="img/{s}/{i:02d}-thumb.webp" alt="Foto {i+1} – {e(v["nombre"])}"></a>\n' for i in range(n))
    nota = f'<p class="gc">{e(v["precioNota"])}</p>' if v.get('precioNota') else ''
    body = f'''<div class="hero"><img class="v" src="img/{s}/00.webp" alt="{e(v['nombre'])}" fetchpriority="high"></div>
<main class="wrap">
  <span class="tag">Venta · Vehículo</span>
  <h1>{e(v['nombre'])}</h1>
  <p class="loc">📍 {e(v['ubicacion'])}</p>
  <p class="price">{precio}</p>
  {nota}
  <a class="wa" href="{wa}">💬 Consulta por WhatsApp</a>
  <div class="grid">{''.join(f'<div class="feat"><b>{e(a)}</b>{e(b)}</div>' for a, b in feats)}</div>
  <h2>Descripción</h2>
  <p>{e(v['desc'])}</p>
  <h2>Características</h2>
  <ul class="am">{''.join(f'<li>{e(x)}</li>' for x in v['am'])}</ul>
  <h2>Galería</h2>
  <div class="gal">
{gal}  </div>
  <p style="margin-top:28px"><a class="wa" href="{wa}">💬 Quiero verlo · WhatsApp +56 9 5113 4778</a></p>
  <p><a href="vehiculos.html">← Ver todos los vehículos</a></p>
</main>
{FOOT}<a class="float" href="{wa}">WhatsApp</a>
<script src="js/lightbox.js" defer></script>
</body>
</html>
'''
    open(R + s + '.html', 'w').write(head(f"{v['nombre']} en venta", desc, url, imgs[0], ld) + body)

cards = ''.join(f'''<a class="card" href="{v['slug']}.html"><img src="img/{v['slug']}/00-thumb.webp" width="600" height="400" alt="{e(v['nombre'])}" loading="lazy"><div><span class="tag">Venta</span><h3 style="margin:8px 0 4px">{e(v['nombre'])}</h3><p class="loc" style="margin:0">📍 {e(v['ubicacion'])} · {f"{v['km']:,}".replace(',', '.')} km</p><p class="price" style="font-size:1.5rem;margin:6px 0 0">{clp(v['precio'])}</p></div></a>''' for v in D)
ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "Vehículos en venta", "url": SITE + "vehiculos.html"}
open(R + 'vehiculos.html', 'w').write(head('Vehículos en venta', 'Vehículos en venta publicados por Jiménez & Asociados en la V Región. Consulta por WhatsApp.', SITE + 'vehiculos.html', SITE + f"img/{D[0]['slug']}/00.webp", ld) +
  f'<main class="wrap"><span class="tag">Vehículos</span><h1>Vehículos en venta</h1><div class="cards">{cards}</div><p><a href="propiedades.html">← Ver propiedades</a></p></main>\n{FOOT}<a class="float" href="https://wa.me/{WA}">WhatsApp</a>\n</body>\n</html>\n')
print('ok', [v['slug'] for v in D])
