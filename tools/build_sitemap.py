#!/usr/bin/env python3
"""Genera public/sitemap.xml con todas las páginas públicas (lastmod = último commit o mtime)."""
import os,glob,subprocess,datetime
os.chdir(os.path.join(os.path.dirname(__file__),'..','public'))
PRIV={'admin','intranet','ingresopartner','contrato-arriendo-aval','orden-venta','orden-visita','reserva-arriendo','tasacion-privada','tasacion-privada2','vehiculos'}
B='https://jimenezyasociados.cl/'
def lm(f):
    try:
        d=subprocess.check_output(['git','log','-1','--format=%cs','--',f],text=True,stderr=subprocess.DEVNULL).strip()
        if d: return d
    except Exception: pass
    return datetime.date.fromtimestamp(os.path.getmtime(f)).isoformat()
out=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
files=sorted(glob.glob('*.html'),key=lambda f:(f!='index.html',f))
for f in files:
    n=f[:-5]
    if n in PRIV: continue
    out.append(f'  <url><loc>{B if n=="index" else B+f}</loc><lastmod>{lm(f)}</lastmod></url>')
out.append('</urlset>')
open('sitemap.xml','w').write('\n'.join(out)+'\n')
print(len(files),'html ->',len(out)-3,'urls')
