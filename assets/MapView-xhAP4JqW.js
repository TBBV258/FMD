import{r as f,a as V,l as E,m as I,C as O,b as w,o as b,h as t,e as y,i as D,n as P,k as T,c as M,p as R,w as z,j as L,t as $,F as W,u as q}from"./vue-vendor-uTGeEaNR.js";import{u as Y}from"./documents-r0kCjH5F.js";import{_ as J}from"./MainLayout.vue_vue_type_script_setup_true_lang-BjYEJNr9.js";import{m as x}from"./maplibre-XFgcxNEv.js";import{B as K}from"./BaseModal-DdaNounK.js";import{b as B}from"./index-B80dBVo-.js";import"./logofmd-DeXnOIzE.js";import"./supabase-aQ0K3vAX.js";function Q(p){const m=new Date,i=typeof p=="string"?new Date(p):p,e=m.getTime()-i.getTime(),d=Math.floor(e/1e3),v=Math.floor(d/60),s=Math.floor(v/60),c=Math.floor(s/24),r=Math.floor(c/7),n=Math.floor(c/30),l=Math.floor(c/365);return d<60?"Agora":v<60?`${v}m`:s<24?`${s}h`:c<7?`${c}d`:r<4?`${r} sem${r>1?"s":""}`:n<12?`${n} mês${n>1?"es":""}`:`${l} ano${l>1?"s":""}`}function X(){const p=f(null),m=f(null),i=f(!1),e="geolocation"in navigator,d=async()=>e?(i.value=!0,m.value=null,new Promise(r=>{navigator.geolocation.getCurrentPosition(n=>{const l={latitude:n.coords.latitude,longitude:n.coords.longitude,accuracy:n.coords.accuracy};p.value=l,i.value=!1,r(l)},n=>{m.value={code:n.code,message:c(n.code)},i.value=!1,r(null)},{enableHighAccuracy:!0,timeout:1e4,maximumAge:0})})):(m.value={code:0,message:"Geolocalização não suportada neste navegador"},null),v=r=>e?navigator.geolocation.watchPosition(l=>{const g={latitude:l.coords.latitude,longitude:l.coords.longitude,accuracy:l.coords.accuracy};p.value=g,r(g)},l=>{m.value={code:l.code,message:c(l.code)}},{enableHighAccuracy:!0,timeout:1e4,maximumAge:0}):(m.value={code:0,message:"Geolocalização não suportada neste navegador"},null),s=r=>{e&&r&&navigator.geolocation.clearWatch(r)},c=r=>{switch(r){case 1:return"Permissão de localização negada";case 2:return"Localização indisponível";case 3:return"Tempo limite excedido";default:return"Erro ao obter localização"}};return{coordinates:p,error:m,isLoading:i,isSupported:e,getCurrentPosition:d,watchPosition:v,clearWatch:s}}const Z={class:"relative w-full h-full"},ee={key:0,class:"absolute inset-0 bg-white/80 dark:bg-dark-bg/80 flex items-center justify-center z-10"},te={class:"absolute top-4 right-4 space-y-2 z-10"},ae=["disabled"],oe={class:"absolute bottom-4 left-4 bg-white dark:bg-dark-card rounded-lg shadow-lg p-3 z-10"},se={class:"space-y-2 text-sm"},le={key:0,class:"flex items-center space-x-2"},ne={key:1,class:"absolute top-4 left-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg z-10"},re=V({__name:"MapComponent",props:{documents:{default:()=>[]},center:{default:()=>[-25.9655,32.5832]},zoom:{default:12},enableMarking:{type:Boolean,default:!1}},emits:["markerClick","locationMarked","navigate"],setup(p,{emit:m}){const i=p,e=m,d=f(null),v=f(!0),s=f(null),c=f([]),r=f(null),n=f(null),l=f(!1),{coordinates:g,getCurrentPosition:h}=X();E(async()=>{u(),await F()}),I(()=>{s.value&&s.value.remove()}),O(()=>i.documents,()=>{_()},{deep:!0});const u=()=>{d.value&&(s.value=new x.Map({container:d.value,style:{version:8,sources:{"osm-tiles":{type:"raster",tiles:["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png","https://b.tile.openstreetmap.org/{z}/{x}/{y}.png","https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256,attribution:"© OpenStreetMap contributors"}},layers:[{id:"osm-tiles",type:"raster",source:"osm-tiles",minzoom:0,maxzoom:19}]},center:[i.center[1],i.center[0]],zoom:i.zoom}),s.value.addControl(new x.NavigationControl,"bottom-right"),s.value.on("click",a=>{l.value&&S(a.lngLat.lat,a.lngLat.lng)}),s.value.on("load",()=>{v.value=!1,_()}))},_=()=>{if(s.value&&(c.value.forEach(a=>a.remove()),c.value=[],i.documents.forEach(a=>{if(!a.location_metadata?.lat||!a.location_metadata?.lng)return;const{lat:o,lng:k}=a.location_metadata,C=document.createElement("div");C.className="custom-marker";const A=a.status==="lost"?"#DC3545":"#28A745",j=a.status==="lost"?"fa-search":"fa-check";C.innerHTML=`
      <div style="
        background-color: ${A};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        cursor: pointer;
      ">
        <i class="fas ${j}"></i>
      </div>
    `;const U=new x.Popup({offset:25}).setHTML(`
      <div class="p-2">
        <h4 class="font-semibold mb-1">${a.title}</h4>
        <p class="text-sm text-gray-600 mb-2">${a.description||"Sem descrição"}</p>
        <p class="text-xs text-gray-500 mb-2">${a.location||"Localização não especificada"}</p>
        <button 
          onclick="window.navigateToDocument('${a.id}')" 
          class="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark"
        >
          Ver detalhes
        </button>
        <button 
          onclick="window.navigateToLocation(${o}, ${k})" 
          class="text-xs bg-success text-white px-3 py-1 rounded hover:bg-success-dark ml-1"
        >
          <i class="fas fa-directions"></i> Navegar
        </button>
      </div>
    `),G=new x.Marker({element:C}).setLngLat([k,o]).setPopup(U).addTo(s.value);C.addEventListener("click",()=>e("markerClick",a)),c.value.push(G)}),c.value.length>0)){const a=new x.LngLatBounds;i.documents.forEach(o=>{o.location_metadata?.lat&&o.location_metadata?.lng&&a.extend([o.location_metadata.lng,o.location_metadata.lat])}),s.value.fitBounds(a,{padding:50})}},F=async()=>{const a=await h();if(a&&s.value){const o=document.createElement("div");o.innerHTML=`
      <div style="
        background-color: #007BFF;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,r.value&&r.value.remove(),r.value=new x.Marker({element:o}).setLngLat([a.longitude,a.latitude]).setPopup(new x.Popup().setHTML("<p>Você está aqui</p>")).addTo(s.value)}},H=()=>{g.value&&s.value&&s.value.flyTo({center:[g.value.longitude,g.value.latitude],zoom:15})},N=()=>{l.value=!l.value,!l.value&&n.value&&(n.value.remove(),n.value=null)},S=(a,o)=>{if(!s.value)return;n.value&&n.value.remove();const k=document.createElement("div");k.innerHTML=`
    <div style="
      background-color: #FFC107;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      animation: pulse 2s infinite;
    ">
      <i class="fas fa-map-marker-alt"></i>
    </div>
  `,n.value=new x.Marker({element:k}).setLngLat([o,a]).addTo(s.value),e("locationMarked",{lat:a,lng:o}),l.value=!1};return typeof window<"u"&&(window.navigateToDocument=a=>{window.location.href=`/document/${a}`},window.navigateToLocation=(a,o)=>{e("navigate",{lat:a,lng:o});const k=`https://www.google.com/maps/dir/?api=1&destination=${a},${o}`;window.open(k,"_blank")}),(a,o)=>(b(),w("div",Z,[t("div",{ref_key:"mapContainer",ref:d,class:"w-full h-full rounded-lg overflow-hidden"},null,512),v.value?(b(),w("div",ee,[...o[0]||(o[0]=[t("div",{class:"text-center"},[t("div",{class:"spinner mb-2"}),t("p",{class:"text-sm text-gray-600 dark:text-gray-400"},"Carregando mapa...")],-1)])])):y("",!0),t("div",te,[t("button",{class:"btn-icon bg-white dark:bg-dark-card shadow-lg",onClick:H,disabled:!D(g),title:"Centralizar na minha localização"},[...o[1]||(o[1]=[t("i",{class:"fas fa-crosshairs"},null,-1)])],8,ae),p.enableMarking?(b(),w("button",{key:0,class:P(["btn-icon bg-white dark:bg-dark-card shadow-lg",{"bg-primary text-white":l.value}]),onClick:N,title:"Marcar localização"},[...o[2]||(o[2]=[t("i",{class:"fas fa-map-pin"},null,-1)])],2)):y("",!0)]),t("div",oe,[t("div",se,[o[4]||(o[4]=t("div",{class:"flex items-center space-x-2"},[t("div",{class:"w-3 h-3 rounded-full",style:{"background-color":"#DC3545"}}),t("span",null,"Perdidos")],-1)),o[5]||(o[5]=t("div",{class:"flex items-center space-x-2"},[t("div",{class:"w-3 h-3 rounded-full",style:{"background-color":"#28A745"}}),t("span",null,"Recuperados")],-1)),D(g)?(b(),w("div",le,[...o[3]||(o[3]=[t("div",{class:"w-3 h-3 rounded-full",style:{"background-color":"#007BFF"}},null,-1),t("span",null,"Você",-1)])])):y("",!0)])]),l.value?(b(),w("div",ne,[...o[6]||(o[6]=[t("i",{class:"fas fa-info-circle mr-2"},null,-1),T(" Clique no mapa para marcar a localização ",-1)])])):y("",!0)]))}}),ie={class:"h-[calc(100vh-8rem)]"},ce={key:0,class:"aspect-video bg-gray-200 dark:bg-dark-card rounded-lg overflow-hidden mb-4"},ue=["src","alt"],de={class:"space-y-3"},me={class:"flex items-center space-x-2"},fe={class:"badge badge-primary"},pe={key:0,class:"text-sm text-gray-600 dark:text-gray-400"},ve={class:"space-y-2 text-sm"},ge={class:"flex items-start"},be={class:"flex items-start"},he={class:"flex space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-dark-border"},ze=V({__name:"MapView",setup(p){const m=q(),i=Y(),e=f(null),d=f(!1),v=M(()=>i.documents),s=M(()=>e.value?{lost:"badge badge-danger",found:"badge badge-success",matched:"badge bg-purple-500/10 text-purple-500",returned:"badge badge-success"}[e.value.status]||"badge badge-primary":""),c=M(()=>e.value?{lost:"Perdido",found:"Encontrado",matched:"Match",returned:"Devolvido",normal:"Normal"}[e.value.status]||e.value.status:""),r=M(()=>e.value?{passport:"fas fa-passport",id_card:"fas fa-id-card",driver_license:"fas fa-id-card-alt",birth_certificate:"fas fa-file-alt",other:"fas fa-file"}[e.value.type]||"fas fa-file":""),n=M(()=>e.value?{passport:"Passaporte",id_card:"BI",driver_license:"Carta",birth_certificate:"Certidão",other:"Outro"}[e.value.type]||"Documento":""),l=h=>{e.value=h,d.value=!0},g=()=>{e.value&&m.push(`/document/${e.value.id}`)};return E(async()=>{v.value.length===0&&await i.fetchDocuments()}),(h,u)=>(b(),R(J,null,{default:z(()=>[t("div",ie,[L(re,{documents:v.value,onMarkerClick:l},null,8,["documents"])]),L(K,{modelValue:d.value,"onUpdate:modelValue":u[1]||(u[1]=_=>d.value=_),title:e.value?.title},{default:z(()=>[e.value?(b(),w(W,{key:0},[e.value.thumbnail_url||e.value.file_url?(b(),w("div",ce,[t("img",{src:e.value.thumbnail_url||e.value.file_url,alt:e.value.title,class:"w-full h-full object-cover"},null,8,ue)])):y("",!0),t("div",de,[t("div",me,[t("span",{class:P(s.value)},$(c.value),3),t("span",fe,[t("i",{class:P([r.value,"mr-1"])},null,2),T(" "+$(n.value),1)])]),e.value.description?(b(),w("p",pe,$(e.value.description),1)):y("",!0),t("div",ve,[t("div",ge,[u[2]||(u[2]=t("i",{class:"fas fa-map-marker-alt text-gray-400 w-5 mt-0.5"},null,-1)),t("span",null,$(e.value.location||"Localização não especificada"),1)]),t("div",be,[u[3]||(u[3]=t("i",{class:"fas fa-clock text-gray-400 w-5 mt-0.5"},null,-1)),t("span",null,$(D(Q)(e.value.created_at)),1)])])]),t("div",he,[L(B,{variant:"primary",class:"flex-1",onClick:g},{default:z(()=>[...u[4]||(u[4]=[T(" Ver Detalhes ",-1)])]),_:1}),L(B,{variant:"outline",onClick:u[0]||(u[0]=_=>d.value=!1)},{default:z(()=>[...u[5]||(u[5]=[T(" Fechar ",-1)])]),_:1})])],64)):y("",!0)]),_:1},8,["modelValue","title"])]),_:1}))}});export{ze as default};
