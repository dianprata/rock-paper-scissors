import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue';
import Loading from 'vue-loading-overlay';
import App from './App.vue';
import router from './router';
import store from './store';

// Init plugin
Vue.use(Loading);
Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
