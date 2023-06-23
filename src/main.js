import Vue from 'vue'
import App from './App.vue'
import Progress from 'vue-multiple-progress'

import '@/styles/global/reset.scss'
import '@/styles/global/app.scss'

Vue.config.productionTip = false
Vue.use(Progress)

new Vue({
  render: h => h(App)
}).$mount('#app')
