from pathlib import Path
import subprocess,re,json
BASE=Path(__file__).resolve().parent.parent;out=BASE/'public/fonts';out.mkdir(exist_ok=True)
def get(url):return subprocess.run(['curl.exe','--fail','--silent','--show-error','--location','--max-time','30',url],capture_output=True,check=True).stdout
sources=[('Barlow Condensed','barlow-condensed.ttf','https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/BarlowCondensed-SemiBold.ttf','600'),('Open Sans','open-sans.ttf','https://raw.githubusercontent.com/google/fonts/main/ofl/opensans/OpenSans%5Bwdth,wght%5D.ttf','400 700')]
final=[];manifest=[]
for family,name,src,weight in sources:
 (out/name).write_bytes(get(src));final.append(f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};font-display:swap;src:url('/fonts/{name}') format('truetype');}}")
 manifest.append({'file':name,'source':src})
(out/'fonts.css').write_text('\n'.join(final),encoding='utf-8')
# Both Google Fonts families use the SIL Open Font License.
for family,url in [('barlowcondensed','https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/OFL.txt'),('opensans','https://raw.githubusercontent.com/google/fonts/main/ofl/opensans/OFL.txt')]:
 (out/(family+'-OFL.txt')).write_bytes(get(url))
(BASE/'data/font-sources.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8');print('local fonts',len(final))
