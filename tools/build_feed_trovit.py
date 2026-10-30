#!/usr/bin/env python3
"""Genera public/feeds/trovit-arriendos.xml (formato Trovit Casas Chile).
Fuente: public/data/propiedades.json + estado (listón ARRENDADO/VENDIDO) en arriendos.html
+ fotos referenciadas en cada ficha arriendo-*.html. Sin calle/número/edificio."""
import json, re, os, sys
from xml.sax.saxutils import escape
import xml.dom.minidom

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
BASE = 'https://jimenezyasociados.cl/'
AGENCY = 'Jiménez & Asociados'
REGION = 'Valparaíso'
MAX_PICS = 20

TYPE = {'Casa': 'For Rent', 'Departamento': 'For Rent',
        'Oficina': 'Office For Rent', 'Local comercial': 'For Rent Local'}
STREET = re.compile(r'\b(Av\.?|Avenida|Calle|Pasaje|Psje\.?)\s+[^,.:;()]+', re.I)
BANNED = re.compile(r'liagora|karime|bailey|\b\d{3,5}\s*$', re.I)


def clean(text):
    t = STREET.sub('', text or '')
    t = re.sub(r'\([^)]*\)', '', t)                      # "(cerca de ...)"
    t = re.sub(r'\ben\s*,', 'en', t)
    t = re.sub(r'\s+,', ',', t)
    t = re.sub(r',\s*,', ',', t)
    t = re.sub(r'\s{2,}', ' ', t).strip(' ,')
    return t


def sector(p):
    s = clean(p.get('direccion', ''))
    parts = [x.strip() for x in s.split(',') if x.strip()]
    if not parts or parts[0] == p.get('comuna'):
        return None
    return parts[0]


def cdata(v):
    return '<![CDATA[%s]]>' % str(v).replace(']]>', ']]]]><![CDATA[>')


def main():
    props = json.load(open(os.path.join(ROOT, 'data/propiedades.json'), encoding='utf-8'))['propiedades']
    listing = open(os.path.join(ROOT, 'arriendos.html'), encoding='utf-8').read()
    out = ['<?xml version="1.0" encoding="utf-8"?>', '<trovit>']
    n = 0
    for p in props:
        if p.get('tipo') != 'Arriendo' or p.get('estado'):
            continue
        url = p['url']
        slug = url[:-5]
        # tarjeta con listón ARRENDADO/VENDIDO -> no disponible
        m = re.search(r'<a[^>]+href="%s"' % re.escape(url), listing)
        card_img = 'img/%s/' % slug
        idx = listing.find(card_img)
        if idx >= 0 and 'estado-ribbon' in listing[idx: idx + 600]:
            continue
        ficha = open(os.path.join(ROOT, url), encoding='utf-8').read()
        pics = []
        for f in re.findall(r'img/%s/(\d+\.(?:webp|jpg|jpeg|png))' % re.escape(slug), ficha):
            if f not in pics:
                pics.append(f)
        pics = pics[:MAX_PICS]
        title = clean(p['titulo'])
        content = clean(p.get('descripcion', ''))
        for t in (title, content):
            if BANNED.search(t):
                sys.exit('Dato prohibido en %s: %s' % (p['id'], t))
        ad = {'id': p['id'], 'url': BASE + url, 'title': title,
              'type': TYPE.get(p.get('tipoPropiedad'), 'For Rent'),
              'agency': AGENCY, 'content': content}
        lines = ['  <ad>'] + ['    <%s>%s</%s>' % (k, cdata(v), k) for k, v in ad.items()]
        if p.get('precioNumerico'):
            lines.append('    <price period="monthly">%s</price>' % cdata(int(p['precioNumerico'])))
        if ad['type'] == 'For Rent' and p.get('tipoPropiedad'):
            lines.append('    <property_type>%s</property_type>' % cdata(p['tipoPropiedad']))
        if p.get('m2'):
            lines.append('    <floor_area unit="meters">%s</floor_area>' % cdata(p['m2']))
        if p.get('dormitorios'):
            lines.append('    <rooms>%s</rooms>' % cdata(p['dormitorios']))
        if p.get('banos'):
            lines.append('    <bathrooms>%s</bathrooms>' % cdata(p['banos']))
        if p.get('estacionamiento') or p.get('estacionamientos'):
            lines.append('    <parking>%s</parking>' % cdata(1))
        if p.get('amoblado'):
            lines.append('    <is_furnished>%s</is_furnished>' % cdata(1))
        sec = sector(p)
        if sec:
            lines.append('    <neighborhood>%s</neighborhood>' % cdata(sec))
            lines.append('    <city_area>%s</city_area>' % cdata(sec))
        lines.append('    <city>%s</city>' % cdata(p['comuna']))
        lines.append('    <region>%s</region>' % cdata(REGION))
        lines.append('    <by_owner>%s</by_owner>' % cdata(0))
        if pics:
            lines.append('    <pictures>')
            for i, f in enumerate(pics):
                feat = ' featured="true"' if i == 0 else ''
                lines.append('      <picture%s><picture_url>%s</picture_url><picture_title>%s</picture_title></picture>'
                             % (feat, cdata(BASE + 'img/%s/%s' % (slug, f)), cdata(title)))
            lines.append('    </pictures>')
        lines.append('  </ad>')
        out += lines
        n += 1
    out.append('</trovit>')
    xml_text = '\n'.join(out) + '\n'
    xml.dom.minidom.parseString(xml_text.encode('utf-8'))  # valida bien formado
    os.makedirs(os.path.join(ROOT, 'feeds'), exist_ok=True)
    open(os.path.join(ROOT, 'feeds/trovit-arriendos.xml'), 'w', encoding='utf-8').write(xml_text)
    print('trovit-arriendos.xml: %d avisos' % n)


if __name__ == '__main__':
    main()
