from pathlib import Path
import urllib.request,urllib.parse,json,re,concurrent.futures,hashlib,subprocess
from bs4 import BeautifulSoup
BASE=Path(__file__).resolve().parent.parent
RAW=BASE/'data'/'source';RAW.mkdir(parents=True,exist_ok=True)
def get(url):
 result=subprocess.run(['curl.exe','--fail','--silent','--show-error','--location','--max-time','45','--write-out','\n__FINAL_URL__%{url_effective}',url],capture_output=True,check=True)
 data,final=result.stdout.rsplit(b'\n__FINAL_URL__',1);return data,final.decode('utf-8')
def clean(x):return re.sub(r'\s+',' ',x).strip()
urls=[];listings=[]
for n in [1,2]:
 url='https://hqd-spindlemotor.com/product-category/aggregates/'+('page/2/' if n==2 else '')
 data,_=get(url);(RAW/f'category-{n}.html').write_bytes(data);s=BeautifulSoup(data,'html.parser')
 cards=s.select('li.product') or s.select('.product.type-product')
 if not cards:
  cards=[a.parent for a in s.select('h2 a[href*="/product/"]')]
 for card in cards:
  a=card.select_one('a[href*="/product/"]');title=card.select_one('h2') or card.select_one('h3')
  if a:
   u=a.get('href');listings.append({'page':n,'url':u,'title':clean(title.get_text()) if title else clean(a.get_text())})
   if u not in urls:urls.append(u)
 if not cards:
  for a in s.select('a[href*="hqd-spindlemotor.com/product/"]'):
   if a.find(['h2','h3']) or a.find_parent(['h2','h3']):
    u=a.get('href');listings.append({'page':n,'url':u,'title':clean(a.get_text())})
    if u not in urls:urls.append(u)
print('category product links',len(urls),flush=True)
(BASE/'data'/'category-listings.json').write_text(json.dumps(listings,ensure_ascii=False,indent=2),encoding='utf-8')
def product(url):
 data,canonical=get(url);s=BeautifulSoup(data,'html.parser');slug=urllib.parse.unquote(urllib.parse.urlparse(canonical).path.strip('/').split('/')[-1]);key=hashlib.sha1(canonical.encode()).hexdigest()[:10]
 (RAW/f'{key}.html').write_bytes(data)
 h=s.select_one('h1.product_title') or s.select_one('h1');desc=s.select_one('#tab-description') or s.select_one('.woocommerce-Tabs-panel--description')
 table=[]
 if desc:
  for tr in desc.select('tr'):
   cells=[clean(t.get_text(' ',strip=True)) for t in tr.select('th,td')]
   if cells:table.append(cells)
 imgs=[]
 for a in s.select('.woocommerce-product-gallery a'):
  u=a.get('href','')
  if re.search(r'\.(?:jpg|jpeg|png|webp)(?:\?|$)',u,re.I) and u not in imgs:imgs.append(u)
 for im in s.select('.woocommerce-product-gallery img'):
  u=im.get('data-large_image') or im.get('data-src') or im.get('src','')
  if u and not u.startswith('data:') and u not in imgs:imgs.append(u)
 if not imgs:
  og=s.find('meta',property='og:image')
  if og:imgs.append(og.get('content'))
 return {'requestedUrl':url,'sourceUrl':canonical,'sourceKey':key,'slug':slug,'title':clean(h.get_text()) if h else slug,'table':table,'description':clean(desc.get_text(' ',strip=True)) if desc else '', 'images':imgs}
def safe_product(url):
 try:return product(url)
 except Exception as e:return {'requestedUrl':url,'sourceUrl':url,'title':next((a['title'] for a in listings if a['url']==url),''),'images':[],'table':[],'description':'','error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:products=list(pool.map(safe_product,urls))
(BASE/'data'/'source-products.json').write_text(json.dumps(products,ensure_ascii=False,indent=2),encoding='utf-8')
(BASE/'data'/'category-listings.json').write_text(json.dumps(listings,ensure_ascii=False,indent=2),encoding='utf-8')
for p in products:print(json.dumps({'title':p['title'],'url':p['sourceUrl'],'images':len(p['images']),'table':p['table']},ensure_ascii=False),flush=True)
for name,url in [('atemag-home','https://www.atemag.de/home-en.html'),('atemag-detail','https://www.atemag.de/vario-classic-smart-line-en.html')]:
 data,_=get(url);(RAW/(name+'.html')).write_bytes(data);s=BeautifulSoup(data,'html.parser');styles=[urllib.parse.urljoin(url,l.get('href','')) for l in s.select('link[rel="stylesheet"]')]
 print(name,'styles',json.dumps(styles),flush=True)
 for i,u in enumerate(styles[-5:]):
  try:css,_=get(u);(RAW/f'{name}-{i}.css').write_bytes(css)
  except Exception as e:print('style unavailable',type(e).__name__)
