import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const products=JSON.parse(readFileSync(new URL('../src/data/products.json',import.meta.url),'utf8'));
const audit=JSON.parse(readFileSync(new URL('../data/source-audit.json',import.meta.url),'utf8'));
test('every canonical category product is represented and alias is documented',()=>{assert.equal(audit.categoryEntries,12);assert.equal(products.length,11);assert.equal(new Set(products.map(p=>p.slug)).size,11);assert.equal(audit.alias.resolvesTo,'iso30-er25-45');});
test('every product has its own local image, specifications and HQD provenance',()=>{for(const p of products){assert.ok(p.summary&&p.specs.length&&p.sourceUrl.startsWith('https://hqd-spindlemotor.com/'));assert.ok(p.gallery.length,p.model);for(const image of p.gallery)assert.ok(existsSync(new URL('../public'+image,import.meta.url)),image);}});
test('critical speed/interface values are not replaced by competitor specifications',()=>{const duo=products.find(p=>p.id==='hsk63f-er25-duo');assert.match(JSON.stringify(duo.specs),/8400rpm/);assert.match(JSON.stringify(duo.specs),/12000rpm/);const ad=products.find(p=>p.id==='ad-iso30-er25');assert.equal(ad.interface,'ISO30');assert.match(JSON.stringify(ad.specs),/95°/);assert.equal(ad.sourceType,'project-owner');});
