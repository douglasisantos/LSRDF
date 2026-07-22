import { createApp } from 'vue';
import { createPinia } from 'pinia';
import {
  Notify,
  QAvatar,
  QBanner,
  QBtn,
  QChip,
  QDrawer,
  QHeader,
  QIcon,
  QInput,
  QItem,
  QItemLabel,
  QItemSection,
  QLayout,
  QLinearProgress,
  QList,
  QPage,
  QPageContainer,
  QSelect,
  QSpace,
  QTable,
  QTd,
  QToolbar,
  QTooltip,
  Quasar,
  Ripple
} from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/dist/quasar.css';
import langPtBr from 'quasar/lang/pt-BR';
import './styles/main.scss';
import App from './App.vue';
import router from './router';

createApp(App)
  .use(createPinia())
  .use(router)
  .use(Quasar, {
    components: {
      QAvatar,
      QBanner,
      QBtn,
      QChip,
      QDrawer,
      QHeader,
      QIcon,
      QInput,
      QItem,
      QItemLabel,
      QItemSection,
      QLayout,
      QLinearProgress,
      QList,
      QPage,
      QPageContainer,
      QSelect,
      QSpace,
      QTable,
      QTd,
      QToolbar,
      QTooltip
    },
    directives: {
      Ripple
    },
    plugins: { Notify },
    lang: langPtBr,
    config: {
      brand: {
        primary: '#151853',
        secondary: '#046434',
        accent: '#c91921',
        positive: '#046434',
        warning: '#e5bd17'
      }
    }
  })
  .mount('#app');
