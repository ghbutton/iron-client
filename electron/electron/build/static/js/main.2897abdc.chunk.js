(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{21:function(e,t,a){e.exports=a(47)},26:function(e,t,a){},28:function(e,t,a){},32:function(e,t,a){},34:function(e,t,a){},38:function(e,t,a){},42:function(e,t,a){},44:function(e,t,a){},47:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),c=a(19),i=a.n(c),s=(a(26),a(5)),l=a(6),o=a(8),u=a(7),h=a(9),m=(a(28),a(2)),d=a.n(m),p=a(4),b=(a(32),a(48)),f=(a(34),function(e){function t(){return Object(s.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(h.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return r.a.createElement("footer",{className:"footer"},r.a.createElement("div",{className:"container-fluid"},r.a.createElement("nav",{className:"navbar"},r.a.createElement("ul",{className:"navbarContainer"},r.a.createElement("li",null,r.a.createElement(b.a,{to:"/"},"Chats")),r.a.createElement("li",null,r.a.createElement(b.a,{to:"/settings"},"Settings"))))))}},{key:"componentDidMount",value:function(){document.body.classList.toggle("withFooter",!0)}},{key:"componentWillUnmount",value:function(){document.body.classList.remove("withFooter")}}]),t}(n.Component)),v=function(e){function t(){var e,a;Object(s.a)(this,t);for(var n=arguments.length,r=new Array(n),c=0;c<n;c++)r[c]=arguments[c];return(a=Object(o.a)(this,(e=Object(u.a)(t)).call.apply(e,[this].concat(r)))).state={loaded:!1,connectedUsers:[]},a}return Object(h.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return r.a.createElement("div",{className:"ChatsPage"},r.a.createElement("div",{className:"chatsMenu"},r.a.createElement("ul",null,r.a.createElement("li",{className:"pull-right"},r.a.createElement(b.a,{to:"/new_chat"},"New")))),r.a.createElement("div",{className:"container"},r.a.createElement("h1",null,"Chats"),r.a.createElement("ul",null,this.state.connectedUsers.map(function(e){var t=e.attributes.name;return null===e.attributes.name&&(t=e.attributes.email),console.log(e.attributes),r.a.createElement("li",{key:e.id},r.a.createElement(b.a,{to:"/connections/".concat(e.id,"/messages")},t))}))),r.a.createElement(f,null))}},{key:"componentDidMount",value:function(){var e=Object(p.a)(d.a.mark(function e(){var t;return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,window.controller.notLoggedIn();case 2:if(!e.sent){e.next=5;break}console.log("Redirecting to login page"),this.props.history.push("/login");case 5:return e.next=7,window.controller.getConnectedUsers();case 7:t=e.sent,this.setState({connectedUsers:t,loaded:!0});case 9:case"end":return e.stop()}},e,this)}));return function(){return e.apply(this,arguments)}}()}]),t}(n.Component),g=a(3),w=(a(38),function(e){function t(e){var a;return Object(s.a)(this,t),(a=Object(o.a)(this,Object(u.a)(t).call(this,e))).state={connectedUser:null,loaded:!1,value:"",userMessages:[]},a.handleChange=a.handleChange.bind(Object(g.a)(Object(g.a)(a))),a.handleSubmit=a.handleSubmit.bind(Object(g.a)(Object(g.a)(a))),a.handleNewMessage=a.handleNewMessage.bind(Object(g.a)(Object(g.a)(a))),window.apiCallbacks.newMessage=a.handleNewMessage,a}return Object(h.a)(t,e),Object(l.a)(t,[{key:"handleChange",value:function(){var e=Object(p.a)(d.a.mark(function e(t){return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:this.setState({value:t.target.value});case 1:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"handleNewMessage",value:function(){var e=Object(p.a)(d.a.mark(function e(){var t;return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,window.controller.getMessages(this.state.connectedUser.id);case 2:t=e.sent,this.setState({userMessages:t});case 4:case"end":return e.stop()}},e,this)}));return function(){return e.apply(this,arguments)}}()},{key:"handleSubmit",value:function(){var e=Object(p.a)(d.a.mark(function e(t){return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:window.controller.sendMessage(this.state.value,this.props.match.params.id),this.setState({value:""}),t.preventDefault();case 3:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"render",value:function(){return r.a.createElement("div",null,r.a.createElement(b.a,{to:"/"},"< Back"),r.a.createElement("h2",null,"Messages ",null===this.state.connectedUser?"":"- ".concat(this.state.connectedUser.attributes.name)),r.a.createElement("div",null,this.state.userMessages.map(function(e,t){return r.a.createElement("p",{key:e.id},e.attributes.decryptedBody.data)})),r.a.createElement("form",{onSubmit:this.handleSubmit},r.a.createElement("label",null,r.a.createElement("textarea",{value:this.state.value,onChange:this.handleChange,placeholder:"Write a message..."})),r.a.createElement("input",{type:"submit",value:"Submit",className:"btn btn-primary"})))}},{key:"componentDidMount",value:function(){var e=Object(p.a)(d.a.mark(function e(){var t,a,n;return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return t=this.props.match.params.id,e.next=3,window.controller.getUserById(t);case 3:return a=e.sent,e.next=6,window.controller.getMessages(t);case 6:n=e.sent,this.setState({connectedUser:a,loaded:!0,userMessages:n});case 8:case"end":return e.stop()}},e,this)}));return function(){return e.apply(this,arguments)}}()}]),t}(n.Component)),E=a(14),j=function(e){function t(e){var a;return Object(s.a)(this,t),(a=Object(o.a)(this,Object(u.a)(t).call(this,e))).state={email:""},a.handleChange=a.handleChange.bind(Object(g.a)(Object(g.a)(a))),a.handleSubmit=a.handleSubmit.bind(Object(g.a)(Object(g.a)(a))),a}return Object(h.a)(t,e),Object(l.a)(t,[{key:"handleChange",value:function(){var e=Object(p.a)(d.a.mark(function e(t){return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:this.setState({email:t.target.value});case 1:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"handleSubmit",value:function(){var e=Object(p.a)(d.a.mark(function e(t){var a,n,r;return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return t.preventDefault(),console.log("Submit"),e.next=4,window.controller.sendVerificationCode(this.state.email);case 4:a=e.sent,console.log(a),n={email:this.state.email},r=E.stringify(n),this.props.history.push({pathname:"/login_verification",search:r});case 9:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"render",value:function(){return r.a.createElement("div",null,r.a.createElement(b.a,{to:"/settings"},"< Back"),r.a.createElement("h2",null,"Login Page"),r.a.createElement("form",{action:"/#/login_verification",method:"get",onSubmit:this.handleSubmit},r.a.createElement("label",null,r.a.createElement("b",null,"Email")),r.a.createElement("input",{type:"text",placeholder:"Email",name:"email",onChange:this.handleChange,required:!0}),r.a.createElement("br",null),r.a.createElement("br",null),r.a.createElement("input",{type:"submit",className:"btn btn-primary",value:"Submit"})))}},{key:"componentDidMount",value:function(){var e=Object(p.a)(d.a.mark(function e(){return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,window.controller.notLoggedIn();case 2:if(e.sent){e.next=5;break}console.log("Redirecting to chats"),this.props.history.push("/");case 5:case"end":return e.stop()}},e,this)}));return function(){return e.apply(this,arguments)}}()}]),t}(n.Component),O=function(e){function t(e){var a;return Object(s.a)(this,t),(a=Object(o.a)(this,Object(u.a)(t).call(this,e))).state={email:"",code:"",errorMessage:""},a.handleChange=a.handleChange.bind(Object(g.a)(Object(g.a)(a))),a.handleSubmit=a.handleSubmit.bind(Object(g.a)(Object(g.a)(a))),a.sendVerificationCode=a.sendVerificationCode.bind(Object(g.a)(Object(g.a)(a))),a}return Object(h.a)(t,e),Object(l.a)(t,[{key:"handleChange",value:function(){var e=Object(p.a)(d.a.mark(function e(t){return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:"code"===t.target.name&&this.setState({code:t.target.value});case 1:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"sendVerificationCode",value:function(){var e=Object(p.a)(d.a.mark(function e(t){var a;return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,window.controller.sendVerificationCode(this.state.email);case 2:a=e.sent,console.log(a);case 4:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"handleSubmit",value:function(){var e=Object(p.a)(d.a.mark(function e(t){var a;return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return t.preventDefault(),e.next=3,window.controller.login(this.state.email,this.state.code);case 3:(a=e.sent).error?this.setState({errorMessage:a.error.message}):(this.setState({verification:""}),console.log("Reloading page"),window.location.reload());case 5:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"render",value:function(){return r.a.createElement("div",null,r.a.createElement(b.a,{to:"/login"},"< Back"),r.a.createElement("h2",null,"Verification Page"),""!==this.state.errorMessage&&r.a.createElement("div",{className:"alert alert-warning",role:"alert"},this.state.errorMessage),r.a.createElement("form",{onSubmit:this.handleSubmit},r.a.createElement("label",null,r.a.createElement("b",null,"Email")),r.a.createElement("input",{type:"text",name:"email",value:this.state.email,disabled:!0}),r.a.createElement("br",null),r.a.createElement("label",null,r.a.createElement("b",null,"Verification Code")),r.a.createElement("input",{type:"text",placeholder:"Enter Code",name:"code",onChange:this.handleChange,required:!0}),r.a.createElement("br",null),r.a.createElement("input",{type:"submit",className:"btn btn-primary",value:"Submit"})),r.a.createElement("br",null),r.a.createElement("button",{onClick:this.sendVerificationCode,className:"btn btn-info"},"Resend Code"))}},{key:"componentDidMount",value:function(){var e=Object(p.a)(d.a.mark(function e(){var t;return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return t=E.parse(this.props.location.search,{ignoreQueryPrefix:!0}),this.setState({email:t.email}),e.next=4,window.controller.notLoggedIn();case 4:if(e.sent){e.next=7;break}console.log("Redirecting to chats"),this.props.history.push("/");case 7:case"end":return e.stop()}},e,this)}));return function(){return e.apply(this,arguments)}}()}]),t}(n.Component),y=(a(42),function(e){function t(){return Object(s.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(h.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return r.a.createElement("div",{className:"SettingsPage"},r.a.createElement("div",{className:"container"},r.a.createElement("h1",null,"Settings"),r.a.createElement(b.a,{to:"/login"},"Login")),r.a.createElement(f,null))}}]),t}(n.Component)),k=(a(44),function(e){function t(e){var a;return Object(s.a)(this,t),(a=Object(o.a)(this,Object(u.a)(t).call(this,e))).state={search:"",results:[]},a.handleChange=a.handleChange.bind(Object(g.a)(Object(g.a)(a))),a}return Object(h.a)(t,e),Object(l.a)(t,[{key:"handleChange",value:function(){var e=Object(p.a)(d.a.mark(function e(t){var a,n,r;return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(a=t.target.value,this.setState({search:a}),!(a.length>3)){e.next=9;break}return e.next=5,window.controller.connectedUsersSearch(a);case 5:n=e.sent,this.setState({results:n}),e.next=11;break;case 9:r=[],this.setState({results:r});case 11:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"render",value:function(){return r.a.createElement("div",{className:"newChatPage"},r.a.createElement(b.a,{to:"/"},"< Back"),r.a.createElement("h1",null,"New Chat"),r.a.createElement("div",null,r.a.createElement(b.a,{to:"/new_contact"},"+ New Contact")),r.a.createElement("br",null),r.a.createElement("form",{onSubmit:this.handleSubmit},r.a.createElement("input",{type:"text",placeholder:"Search",name:"email",onChange:this.handleChange,required:!0})),r.a.createElement("ul",null,this.state.results.map(function(e){return r.a.createElement("li",{key:e.id},r.a.createElement(b.a,{to:"/connections/".concat(e.id,"/messages")},e.attributes.name))})))}}]),t}(n.Component)),C=function(e){function t(e){var a;return Object(s.a)(this,t),(a=Object(o.a)(this,Object(u.a)(t).call(this,e))).state={email:"",name:""},a.handleChange=a.handleChange.bind(Object(g.a)(Object(g.a)(a))),a.handleSubmit=a.handleSubmit.bind(Object(g.a)(Object(g.a)(a))),a}return Object(h.a)(t,e),Object(l.a)(t,[{key:"handleChange",value:function(){var e=Object(p.a)(d.a.mark(function e(t){return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:"name"===t.target.name?this.setState({name:t.target.value}):"email"===t.target.name&&this.setState({email:t.target.value});case 1:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"handleSubmit",value:function(){var e=Object(p.a)(d.a.mark(function e(t){var a;return d.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return t.preventDefault(),e.next=3,window.controller.createNewInvitation(this.state.name,this.state.email);case 3:(a=e.sent).payload&&a.payload.data&&this.props.history.push("/new_chat");case 5:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"render",value:function(){return r.a.createElement("div",{className:"newContactPage"},r.a.createElement(b.a,{to:"/new_chat"},"< Back"),r.a.createElement("h1",null,"New Contact"),r.a.createElement("form",{onSubmit:this.handleSubmit},r.a.createElement("div",{className:"form-group"},r.a.createElement("input",{type:"text",placeholder:"Full name",name:"name",onChange:this.handleChange,required:!0})),r.a.createElement("div",{className:"form-group"},r.a.createElement("input",{type:"email",placeholder:"email",name:"email",onChange:this.handleChange,required:!0})),r.a.createElement("input",{type:"submit",className:"btn btn-primary",value:"Submit"})))}}]),t}(n.Component),S=a(50),x=a(49),N=function(e){function t(){return Object(s.a)(this,t),Object(o.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(h.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return r.a.createElement(S.a,{className:"App"},r.a.createElement("div",null,r.a.createElement(x.a,{exact:!0,path:"/",component:v}),r.a.createElement(x.a,{path:"/connections/:id/messages",component:w}),r.a.createElement(x.a,{path:"/login",component:j}),r.a.createElement(x.a,{path:"/login_verification",component:O}),r.a.createElement(x.a,{path:"/settings",component:y}),r.a.createElement(x.a,{path:"/new_chat",component:k}),r.a.createElement(x.a,{path:"/new_contact",component:C})))}}]),t}(n.Component);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));i.a.render(r.a.createElement(N,{applicationState:window.applicationState}),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()})}},[[21,2,1]]]);
//# sourceMappingURL=main.2897abdc.chunk.js.map