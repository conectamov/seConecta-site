import AOS from 'aos'
import 'aos/dist/aos.css'

export default defineNuxtPlugin(() => {
  AOS.init({ once: true, duration: 600, easing: 'ease-out-cubic', offset: 60 })
})
