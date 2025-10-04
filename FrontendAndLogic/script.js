export const FetchTarget = 'http://localhost:3000'

export async function makeRequest(path,query,method,useToken,body,headers){
 const hasBody = body!=null
 let querystr = ''
 if (query){
  querystr = '?';
  for (const item of Object.keys(query)){
   querystr+=item+'='+query[item]+'&'
  }
  querystr = querystr.slice(0,querystr.length-1);
 }
 try{
  const resultU = await fetch(`${FetchTarget}/${path}${querystr}`,
   {method:method??'GET',
    headers:{
   ...(useToken?{token:localStorage.getItem('token')}:{}),
   ...(hasBody?{'Content-Type':'application/json'}:{}),
   ...(headers??{})
    },
   ...(hasBody?{body:JSON.stringify(body)}:{})
   });
  const response = await resultU.json();
  if (!response.ok){//because sometimes I don't include a true ok on success, but always false on error
   alert(response.error)
  }
  return response
 }
 catch(e){
  alert(e);
  return null
 }
}

export async function getUser(){
 const userJson = await makeRequest('users',null,'GET',true)
 if (!userJson.ok){
  redirecionar('index')
 }
 return userJson.result
}
export function getRankString(num){
 switch (num){
  case 1: return'Aluno';break;
  case 2: return'Zelador';break;
  case 3: return'Professor';break;
  case 4: return'Coordenador';break;
  case 5: return'Gestor';break;
  case 6: return'Desenvolvedor';break;
 }
}

export async function criarSidebar(){
 const user = await getUser();
 const core = document.createElement('div')

 const profile = document.createElement('div')
 profile.className = 'perfil';

 const profSn = document.createElement('p');
 profSn.innerHTML = 'ETE Ministro Fernando Lyra'
 profile.appendChild(profSn);
 
 const profileImg = document.createElement('img');
 profileImg.src = '../perfil.png';
 profile.appendChild(profileImg);

 const profileP1 = document.createElement('p');
 profileP1.innerHTML = 'Nome: '+user.nome
 profile.appendChild(profileP1);

 const profileP3 = document.createElement('p');
 let rankstr = getRankString(user.rank);
 profileP3.innerHTML = 'Cargo: '+rankstr;
 profile.appendChild(profileP3);

 const sectorNav = document.createElement('nav')
 sectorNav.className = 'menu-setores';
 sectorNav.appendChild(document.createElement('br'))
 
 const infoList = document.createElement('ul');

 const infoListItems = [{name:'Setores',file:'Mostrar'},{name:'Usuários',file:'users',rank:4},{name:'Histórico de uso',file:'registry',rank:4},{name:'Manutenção',file:'fixers'},{name:'Logout',file:'index'}]

 for (let i=0;i<infoListItems.length;i++){
  const o = infoListItems[i];
  if ((o.rank??0) > user.rank)
   continue;
  
  const item = document.createElement('li')
  item.onclick = function(){
   redirecionar(o.file);
  }
  item.innerHTML = o.name
  infoList.appendChild(item)
 }

 sectorNav.appendChild(infoList)

 core.appendChild(profile)
 core.appendChild(sectorNav)

 return core;
}

export function redirecionar(pagina,parametros) {
 const query = new URLSearchParams(parametros??{}).toString();
 window.location.href = `./${pagina}.html${parametros?`?${query}`:''}`;
}
