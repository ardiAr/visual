import {parser} from 'https://esm.sh/@lezer/cpp@1.1.6';
const sample=`#include <iostream>
using namespace std;
struct Node { int data; Node* next; };
int main() {
    Node* head = new Node();
    Node* second = new Node();
    Node* third = new Node();
    head->data = 10;
    head->next = second;
    second->data = 20;
    second->next = third;
    third->data = 30;
    third->next = NULL;
    Node* temp = head;
    while (temp != NULL) {
        cout << temp->data << " -> ";
        temp = temp->next;
    }
    cout << "NULL" << endl;
    return 0;
}`;
const $=id=>document.getElementById(id);
const address=id=>id===null?'NULL':'0x'+(id*4096).toString(16).toUpperCase();
const kids=n=>{const a=[];for(let c=n.firstChild;c;c=c.nextSibling)a.push(c);return a};
function simulate(source){
 const steps=[],nodes=[],pointers=Object.create(null),ints=Object.create(null);let output='',line=1;
 const text=n=>source.slice(n.from,n.to), fail=m=>{throw Error(m)};
 const heap=id=>{const n=nodes.find(n=>n.id===id);if(!n||n.deleted)fail('Akses pointer NULL atau memori terhapus.');return n};
 const record=(n,description)=>{line=source.slice(0,n.from).split('\n').length;if(steps.length>=500)fail('Batas 500 langkah tercapai. Periksa loop melingkar.');steps.push({line,description,nodes:nodes.map(n=>({...n})),pointers:{...pointers},output})};
 function value(n){const p=kids(n),s=text(n);switch(n.name){
 case 'Number':return Number(s);
 case 'String':return JSON.parse(s);
 case 'NULL':case 'Nullptr':return null;
 case 'Identifier':if(s==='NULL'||s==='nullptr')return null;if(s==='endl')return '\n';if(Object.hasOwn(pointers,s))return pointers[s];if(Object.hasOwn(ints,s))return ints[s];return fail('Variabel '+s+' belum dideklarasikan.');
 case 'NewExpression':if(!/^new\s+Node\s*(\(\s*\))?$/.test(s))fail('Alokasi yang didukung: new Node().');if(nodes.length>=40)fail('Batas 40 node.');const id=nodes.length+1;nodes.push({id,data:0,next:null,deleted:false});return id;
 case 'FieldExpression':if(!s.includes('->'))fail('Gunakan operator ->.');const node=heap(value(p[0])),field=text(p.at(-1));if(!['data','next'].includes(field))fail('Anggota tidak didukung: '+field);return node[field];
 case 'ConditionClause':case 'ParenthesizedExpression':return value(p.find(x=>!['(',')'].includes(x.name)));
 case 'UnaryExpression':const v=value(p.at(-1));if(s.startsWith('!'))return !v;if(s.startsWith('-')&&typeof v==='number')return -v;return fail('Operator unary tidak didukung.');
 case 'BinaryExpression':const a=value(p[0]),b=value(p.at(-1)),op=source.slice(p[0].to,p.at(-1).from).trim();if(op==='!=')return a!==b;if(op==='==')return a===b;if(typeof a==='number'&&typeof b==='number'){if(op==='+')return a+b;if(op==='-')return a-b;if(op==='*')return a*b;if(op==='<')return a<b;if(op==='>')return a>b}return fail('Operator tidak didukung: '+op);
 default:return fail('Ekspresi belum didukung: '+s);
 }}
 function print(n){if(n.name==='Identifier'&&text(n)==='cout')return;const p=kids(n);if(n.name==='BinaryExpression'&&source.slice(p[0].to,p.at(-1).from).trim()==='<<'){print(p[0]);output+=String(value(p.at(-1)))}else fail('Format cout tidak didukung.')}
 function execute(n){line=source.slice(0,n.from).split('\n').length;const p=kids(n);switch(n.name){
 case 'CompoundStatement':for(const c of p.filter(c=>!['{','}','Comment'].includes(c.name)))if(execute(c))return true;return false;
 case 'Declaration':const type=p.find(c=>['TypeIdentifier','PrimitiveType'].includes(c.name));if(!type||!['Node','int'].includes(text(type)))fail('Deklarasi yang didukung: Node* dan int.');const ds=p.filter(c=>c.name==='InitDeclarator');if(!ds.length)fail('Deklarasi harus memiliki nilai awal.');for(const d of ds){const k=kids(d),first=k[0],ident=first.name==='PointerDeclarator'?first.getChild('Identifier'):first;if(!ident||k.length<2)fail('Deklarasi tidak lengkap.');const name=text(ident),v=value(k.at(-1));if(text(type)==='Node'&&first.name==='PointerDeclarator'&&(typeof v==='number'||v===null))pointers[name]=v;else if(text(type)==='int'&&typeof v==='number')ints[name]=v;else fail('Jenis deklarasi tidak didukung.')}record(n,text(n));return false;
 case 'ExpressionStatement':const e=p[0];if(e.name==='AssignmentExpression'){const k=kids(e),left=k[0],right=k.at(-1);if(source.slice(left.to,right.from).trim()!=='=')fail('Hanya assignment = yang didukung.');const v=value(right);if(left.name==='Identifier'){const name=text(left);if(!Object.hasOwn(pointers,name)&&!Object.hasOwn(ints,name))fail('Variabel belum dideklarasikan: '+name);if(Object.hasOwn(pointers,name)&&(v===null||typeof v==='number'))pointers[name]=v;else if(Object.hasOwn(ints,name)&&typeof v==='number')ints[name]=v;else fail('Nilai assignment tidak valid.')}else if(left.name==='FieldExpression'){const k=kids(left),node=heap(value(k[0])),field=text(k.at(-1));if(field==='data'&&typeof v==='number')node.data=v;else if(field==='next'&&(v===null||typeof v==='number'))node.next=v;else fail('Anggota atau nilai tidak didukung.')}else fail('Assignment tidak didukung.')}else if(/^cout\b/.test(text(e)))print(e);else if(e.name==='DeleteExpression'){const id=value(kids(e).at(-1));if(id!==null)heap(id).deleted=true}else fail('Perintah belum didukung: '+text(n));record(n,text(n));return false;
 case 'WhileStatement':const cond=n.getChild('ConditionClause'),body=p.at(-1);if(!cond||!body)fail('while tidak lengkap.');while(true){const active=Boolean(value(cond));record(cond,'while '+text(cond)+' → '+active);if(!active)break;if(execute(body))return true}return false;
 case 'ReturnStatement':record(n,'Program selesai.');return true;
 case 'Comment':return false;
 default:fail('Perintah belum didukung: '+text(n));
 }}
 try{const tree=parser.parse(source);tree.iterate({enter(n){if(n.type.isError){line=source.slice(0,n.from).split('\n').length;fail('Sintaks C++ tidak valid.')}}});const main=kids(tree.topNode).find(n=>n.name==='FunctionDefinition'&&/\bmain\s*\(/.test(text(n.getChild('FunctionDeclarator')||n)));if(!main)fail('Fungsi int main() tidak ditemukan.');const body=main.getChild('CompoundStatement');if(!body)fail('Body main tidak ditemukan.');record(main,'Program dimulai.');execute(body);return {steps,error:null}}catch(e){return {steps,error:'Baris '+line+': '+e.message}}
}
let trace,index=0,timer=null;
function stop(){clearInterval(timer);timer=null;$('play').textContent='Jalankan'}
function element(tag,cls,content){const e=document.createElement(tag);e.className=cls;e.textContent=content;return e}
function render(){const s=trace.steps[index];$('status').textContent=trace.error?'Periksa kode':'Tersinkronisasi · Live preview';$('error').textContent=trace.error||'';$('description').textContent=s?.description||'';$('output').textContent=s?.output||'—';$('location').textContent='LANGKAH '+(s?index+1:0)+' / '+trace.steps.length+' · BARIS '+(s?.line||'—');$('timeline').max=Math.max(0,trace.steps.length-1);$('timeline').value=index;for(const id of ['play','prev','next','timeline'])$(id).disabled=!!trace.error||!s;$('prev').disabled||=index<=0;$('next').disabled||=index>=trace.steps.length-1;$('pointers').replaceChildren();$('canvas').replaceChildren();if(!s)return;for(const [name,id]of Object.entries(s.pointers))$('pointers').append(element('span','',name+': '+address(id)));for(const [i,n]of s.nodes.entries()){const names=Object.entries(s.pointers).filter(([,id])=>id===n.id).map(([name])=>name),box=element('div','node'+(names.includes('temp')?' focus':'')+(n.deleted?' deleted':''),'');box.dataset.node=n.id;box.append(element('span','address',address(n.id)),element('div','name','Node '+n.id+(n.deleted?' · deleted':'')));const fields=element('div','fields','');for(const [key,v]of [['data',n.data],['next',address(n.next)]]){const field=element('div','','');field.append(element('small','',key),element('span',key,String(v)));fields.append(field)}box.append(fields,element('span','labels',names.join(' · ')));$('canvas').append(box,element('span','arrow',n.next===null?'NULL':n.next===s.nodes[i+1]?.id?'→':'↗ Node '+n.next))}if(!s.nodes.length)$('canvas').append(element('span','','Belum ada node yang dialokasikan.'))}
function compile(){stop();trace=simulate($('code').value);index=Math.max(0,trace.steps.length-1);render()}
$('code').value=sample;$('code').addEventListener('input',compile);$('reset').onclick=()=>{stop();index=0;render()};$('prev').onclick=()=>{stop();index=Math.max(0,index-1);render()};$('next').onclick=()=>{stop();index=Math.min(trace.steps.length-1,index+1);render()};$('timeline').oninput=e=>{stop();index=Number(e.target.value);render()};$('play').onclick=()=>{if(timer){stop();return}if(index>=trace.steps.length-1)index=0;$('play').textContent='Jeda';render();timer=setInterval(()=>{if(index>=trace.steps.length-1){stop();return}index++;render()},Number($('speed').value))};$('speed').onchange=()=>{if(timer){stop();$('play').click()}};$('restore').onclick=()=>{$('code').value=sample;compile()};$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([$('code').value],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download='main.cpp';a.click();URL.revokeObjectURL(url)};$('import').onchange=async e=>{const file=e.target.files[0];if(file){$('code').value=await file.text();compile()}e.target.value=''};$('code').onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();const s=e.target.selectionStart;e.target.setRangeText('    ',s,e.target.selectionEnd,'end');compile()}};compile();
