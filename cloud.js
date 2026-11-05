import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.10/+esm';
const URL='https://sybngyrcwwdrbpqtdgvr.supabase.co';
const KEY='sb_publishable_7Mc7MlGDV_I1y_ht3GFEmg_jDC5nKNA';
const db=createClient(URL,KEY,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true,flowType:'pkce'}});
const $=id=>document.getElementById(id);
let user=null,business=null;
function message(text,bad=false){$('message').textContent=text;$('message').classList.toggle('danger',bad)}
function show(authed){$('login-panel').classList.toggle('hidden',authed);$('app-panel').classList.toggle('hidden',!authed);$('logout').classList.toggle('hidden',!authed)}
function dateInput(s){return s?new Date(s).toISOString().slice(0,10):''}
async function checked(promise){const {data,error}=await promise;if(error)throw error;return data}
async function refresh(){
 const {data:{user:verified},error}=await db.auth.getUser();if(error||!verified){user=null;business=null;show(false);message('Sign in to access your private cloud workspace.');return}
 user=verified;show(true);$('identity').textContent=user.email||'Signed in';
 const businesses=await checked(db.from('businesses').select('id,name').eq('owner_id',user.id).limit(1));
 business=businesses[0]||null;$('business-name').value=business?.name||'';
 const rows=await checked(db.from('quotes').select('id,customer_name,description,amount,status,next_followup_at,created_at').eq('owner_id',user.id).order('created_at',{ascending:false}).limit(500));
 $('count').textContent=rows.length+' saved quote(s)';const container=$('quotes');container.replaceChildren();
 if(!rows.length){const p=document.createElement('p');p.textContent='No cloud quotes yet.';container.append(p)}
 for(const q of rows){const card=document.createElement('div');card.className='quote';const title=document.createElement('strong');title.textContent=q.customer_name+' — '+q.description;const info=document.createElement('p');info.className='muted';info.textContent='£'+Number(q.amount).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})+' · '+q.status+' · Follow-up: '+(dateInput(q.next_followup_at)||'not scheduled');const actions=document.createElement('div');actions.className='row';const label=document.createElement('label');label.textContent='Status';const select=document.createElement('select');select.style.width='auto';for(const st of ['draft','sent','discussion','won','lost']){const o=document.createElement('option');o.value=st;o.textContent=st;if(q.status===st)o.selected=true;select.append(o)}select.addEventListener('change',async()=>{try{select.disabled=true;await checked(db.from('quotes').update({status:select.value}).eq('id',q.id).eq('owner_id',user.id).select('id').single());message('Quote updated.');await refresh()}catch(e){message('Update failed: '+e.message,true)}finally{select.disabled=false}});label.append(select);actions.append(label);card.append(title,info,actions);container.append(card)}
 message('Connected to Supabase. Only test data should be entered until access isolation is verified.');
}
$('login-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{const email=$('email').value.trim();await checked(db.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}}));message('Sign-in email requested. Check your inbox and open the link on this device.')}catch(err){message('Could not send email: '+err.message,true)}finally{button.disabled=false}});
$('logout').addEventListener('click',async()=>{try{await checked(db.auth.signOut());user=null;business=null;show(false);message('Signed out.')}catch(e){message(e.message,true)}});
$('reload').addEventListener('click',()=>refresh().catch(e=>message(e.message,true)));
$('business-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{if(!user)throw Error('Sign in first');const name=$('business-name').value.trim();if(!name)throw Error('Enter a business name');const data=await checked(db.from('businesses').upsert({id:business?.id,owner_id:user.id,name},{onConflict:business?'id':'owner_id'}).select('id,name').single());business=data;message('Business saved.')}catch(err){message('Could not save business: '+err.message,true)}finally{button.disabled=false}});
$('quote-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{if(!user||!business)throw Error('Save your business details first');const customer=$('customer').value.trim(),description=$('description').value.trim();if(!customer||!description)throw Error('Customer and job are required');const amount=Number($('amount').value);if(!Number.isFinite(amount)||amount<0||amount>100000000)throw Error('Invalid amount');await checked(db.from('quotes').insert({owner_id:user.id,business_id:business.id,customer_name:customer,company:$('company').value.trim(),customer_email:$('customer-email').value.trim(),description,amount,status:$('status').value,next_followup_at:$('followup').value?$('followup').value+'T12:00:00Z':null}).select('id').single());e.target.reset();await refresh();message('Quote securely saved to your cloud account.')}catch(err){message('Could not save quote: '+err.message,true)}finally{button.disabled=false}});
db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){user=null;business=null;show(false)}});
refresh().catch(e=>{show(false);message('Connection error: '+e.message,true)});
