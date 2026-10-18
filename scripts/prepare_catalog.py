from pathlib import Path
from bs4 import BeautifulSoup
import json,re,subprocess,concurrent.futures,urllib.parse,hashlib
from PIL import Image
BASE=Path(__file__).resolve().parent.parent;ASSET=BASE/'public'/'images';ASSET.mkdir(parents=True,exist_ok=True)
raw=json.loads((BASE/'data/source-products.json').read_text(encoding='utf-8'))
listings=json.loads((BASE/'data/category-listings.json').read_text(encoding='utf-8'))
thumbs={}
for n in (1,2):
 s=BeautifulSoup((BASE/f'data/source/category-{n}.html').read_text(encoding='utf-8'),'html.parser')
 for c in s.select('li.product'):
  a=c.select_one('a[href*="/product/"]');im=c.select_one('img')
  if a and im:thumbs[a['href']]=im.get('data-src') or im.get('src')
 for a in s.select('a[href*="/product/"]'):
  im=a.select_one('img')
  if im:thumbs[a['href']]=im.get('data-src') or im.get('src')
specs=[
 ('ad-iso30-er25','AD-ISO30-ER25','Adjustable angle head','ISO30','Adjustable',1,['Drilling','Sawing']),
 ('ad-hsk63f-er25','AD-HSK63F-ER25','Adjustable angle head','HSK63F','Adjustable',1,['Drilling','Sawing']),
 ('hsk63f-er25-duo','HSK63F-ER25×2','Dual-output angle head','HSK63F','Dual output',2,['Drilling','Milling']),
 ('hsk63f-er25-duo-saw','HSK63F-ER25×2-S','Dual-output head with saw mount','HSK63F','Sawing',2,['Drilling','Milling','Sawing']),
 ('hsk63f-er25-saw','HSK63F-ER25-S','Angle head with saw mount','HSK63F','Sawing',1,['Drilling','Sawing']),
 ('hsk63f-er25-quattro','HSK63F-ER25×4','Four-output angle head','HSK63F','Four output',4,['Drilling','Milling']),
 ('iso30-er25-duo','ISO30-ER25×2','Dual-output angle head','ISO30','Dual output',2,['Drilling','Milling']),
 ('iso30-er25-duo-saw','ISO30-ER25×2-S','Dual-output head with saw mount','ISO30','Sawing',2,['Drilling','Milling','Sawing']),
 ('iso30-er25-saw','ISO30-ER25-S','Angle head with saw mount','ISO30','Sawing',1,['Drilling','Sawing']),
 ('iso30-er25-45','ISO30-ER25-S-45°','Fixed 45° angle head','ISO30','Fixed angle',1,['Drilling','Sawing']),
 ('iso30-er25-quattro','ISO30-ER25×4','Four-output angle head','ISO30','Four output',4,['Drilling','Milling'])
]
products=[];jobs=[];asset_manifest=[]
for i,meta in enumerate(specs):
 p=raw[i];slug,model,name,interface,family,outputs,operations=meta
 urls=list(p.get('images',[]))
 if not urls and p['requestedUrl'] in thumbs:urls=[thumbs[p['requestedUrl']]]
 drawings=[]
 if p.get('sourceKey'):
  s=BeautifulSoup((BASE/'data/source'/f"{p['sourceKey']}.html").read_text(encoding='utf-8'),'html.parser');desc=s.select_one('#tab-description')
  if desc:
   for im in desc.select('img'):
    u=im.get('data-src') or im.get('src','')
    if u and not u.startswith('data:') and '/uploads/' in u and u not in urls:drawings.append(u)
 # Actual category photos are used only for their matching product; technical drawings stay in the gallery.
 for u in drawings[:3]:
  if u not in urls:urls.append(u)
 gallery=[]
 for j,u in enumerate(urls[:4]):
  local=f'/images/{slug}-{j}.webp';gallery.append(local);jobs.append((u,ASSET/f'{slug}-{j}.webp'));asset_manifest.append({'file':local,'source':u,'product':slug})
 table=[]
 for row in p['table']:
  for k in range(0,len(row)-1,2):table.append({'label':row[k].replace('：','').strip(),'value':row[k+1]})
 notes=[]
 if i==0:
  table=[{'label':a,'value':b} for a,b in [('Input interface','ISO30'),('Tool holder','ER25'),('Maximum drilling input / output speed','12,000 / 12,000 rpm'),('Maximum sawing input / output speed','7,000 / 7,000 rpm'),('Angular adjustment range','95°'),('Maximum drill shank diameter','Ø16 mm'),('Maximum saw blade diameter','Ø180 mm'),('Lubrication','Grease')]]
  notes=['Specifications supplied by the project owner; the linked HQD detail page was unavailable during collection.']
 if i==7:
  table=[{'label':a,'value':b} for a,b in [('Input interface','ISO30'),('Output configuration','ER25 and single-side saw mount'),('Maximum output speed','12,000 rpm'),('Transmission ratio','1:1.43'),('Taper runout','<0.005 mm'),('Maximum saw speed stated in source FAQ','4,200 rpm'),('Lubrication','Grease')]]
  notes=['The source FAQ lists a 4,200 rpm saw limit. Verify the input/output limit and approved saw configuration with HQD before ordering.']
 if i==1:notes=['The live product title identifies an adjustable HSK63F head; older indexed versions of this URL described a different dual-output model. The live title and specification table were used.']
 for row in table:
  if '7000(' in row['value'] and '12000(' in row['value']:row['value']='Drilling: 12,000 rpm · Sawing: 7,000 rpm (maximum)'
  if row['label'].lower()=='reduction ratio':row['label']='Transmission ratio'
 if family=='Adjustable':
  summary=f'Orient an ER25 tool to the required machining angle with a compact {interface} aggregate. Drilling and saw configurations support angled access without rebuilding the machine.'
  paragraphs=[f'The {model} couples to a {interface} spindle and provides an adjustable output axis for access to inclined faces and side features.', 'Set the required angle with the machine stopped, then secure the locking components before operation. Match the tool, speed and clearance to the intended drilling or sawing configuration.']
  features=['Adjustable output orientation','ER25 tool interface','Grease-lubricated transmission']
 elif family=='Four output':
  summary=f'Four ER25 outputs combine multiple tool positions in one {interface} aggregate. The speed-increasing transmission reaches a stated 12,000 rpm output from 8,400 rpm input.'
  paragraphs=[f'The {model} brings four ER25 tool positions together in a compact {interface} head for multi-face work.', 'Its shared input drives the output shafts through a 1:1.43 transmission. A compact body and grease lubrication simplify integration and routine maintenance.']
  features=['Four ER25 output positions','8,400 rpm maximum input','12,000 rpm maximum output']
 elif family=='Dual output':
  summary=f'Two ER25 output positions extend the working envelope of a {interface} spindle. A 1:1.43 transmission supports up to 12,000 rpm at the output.'
  paragraphs=[f'The {model} offers two tool positions from one {interface} input, reducing the need to reposition the workpiece between accessible faces.', 'The stated input speed is 8,400 rpm and the maximum output is 12,000 rpm. The head uses grease lubrication and a compact housing for installation where clearance is limited.']
  features=['Two ER25 output positions','Speed-increasing gear transmission','Compact grease-lubricated body']
 elif family=='Fixed angle':
  summary='A fixed 45° output brings angled drilling and sawing to an ISO30 spindle. The ER25 interface and saw mount cover complementary machining tasks.'
  paragraphs=['A dedicated 45° geometry provides consistent access to inclined features without resetting the angle between parts.', 'The published table specifies a 1:1 ratio, ER25 tooling, a maximum Ø16 mm bit and a maximum Ø180 mm saw blade. Drilling and sawing have different speed limits.']
  features=['Fixed 45° machining orientation','ER25 and saw mounting options','1:1 transmission ratio']
 else:
  summary=f'Combine ER25 tooling and a saw-mount option in a {interface} aggregate. Select the active machining configuration to suit drilling, milling or cutting access.'
  paragraphs=[f'The {model} connects to a {interface} spindle and provides an ER25 tool interface with a saw-blade mounting option.', 'Use the speed limits assigned to the installed tool configuration. Confirm the mounting arrangement, machine clearance and permitted operating sequence with the application team.']
  features=['ER25 tooling with saw-mount option',f'{interface} spindle interface','Separate drilling and sawing speed limits']
 products.append({'id':slug,'slug':slug,'model':model,'name':name,'interface':interface,'family':family,'outputs':outputs,'operations':operations,'summary':summary,'paragraphs':paragraphs,'features':features,'specs':table,'image':gallery[0] if gallery else '', 'gallery':gallery,'sourceUrl':p['sourceUrl'],'sourceTitle':p['title'],'dataNotes':notes,'sourceType':'project-owner' if i==0 else 'HQD product page'})
def download(job):
 u,dest=job
 if dest.exists():return str(dest.name)
 u=urllib.parse.quote(u,safe=':/?=&%');r=subprocess.run(['curl.exe','--fail','--silent','--show-error','--location','--max-time','40',u],capture_output=True)
 if r.returncode:raise RuntimeError(f'Asset failed: {u}')
 import io
 im=Image.open(io.BytesIO(r.stdout)).convert('RGB');im.thumbnail((1400,1400));im.save(dest,'WEBP',quality=89,method=5)
 return dest.name
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 for name in pool.map(download,jobs):print('asset',name,flush=True)
(BASE/'src/data').mkdir(parents=True,exist_ok=True)
(BASE/'src/data/products.json').write_text(json.dumps(products,ensure_ascii=False,indent=2),encoding='utf-8')
(BASE/'data/assets.json').write_text(json.dumps(asset_manifest,ensure_ascii=False,indent=2),encoding='utf-8')
audit={'checkedAt':'2026-10-18','categoryPages':2,'categoryEntries':len(listings),'uniqueProducts':len(products),'alias':{'listing':listings[-1],'resolvesTo':'iso30-er25-45'},'unavailable':[raw[0]['requestedUrl']],'notes':'Source facts and HQD images; all marketing summaries independently rewritten. No ATEMAG product text or imagery copied.'}
(BASE/'data/source-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print('catalogue ready',len(products),'products',len(jobs),'assets')
