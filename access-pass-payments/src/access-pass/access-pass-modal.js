import {AccessPass, config} from 'payments'

const modalHtml = require('./access-pass-modal.html')
const errorHtml = require('./error-message.html')
import './access-pass-modal.scss'

let projectConfig
config.subscribe((c) => {
  projectConfig = c
}).unsubscribe()

const getPriceText = (amount, currency, locale) => {
  const fractionDigits = currency.toLowerCase() === 'jpy' ? 0 : 2
  const formatter = new Intl.NumberFormat(
    locale,
    {
      style: 'currency',
      currencyDisplay: 'narrowSymbol',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }
  )

  return formatter.format(amount)
}

const getAccessDurationText = accessDurationDays => (
  accessDurationDays === 1 ? '1-day' : `${accessDurationDays}-days`
)

const showAccessPassModal = () => {
  const {amount, currency, locale, accessDurationDays} = projectConfig
  const updatedHtml = modalHtml
    .replace('$PRICE_TEXT', getPriceText(amount, currency, locale))
    .replace('$NUM_ACCESS_DAYS', getAccessDurationText(accessDurationDays))
  document.body.insertAdjacentHTML('beforeend', updatedHtml.trim())
  const purchaseButton = document.getElementById('purchase-btn')

  return new Promise((resolve, reject) => {
    purchaseButton.onclick = async () => {
      try {
        await AccessPass.requestPurchaseIfNeeded()
        const container = document.getElementById('modal-container')
        container.remove()
        resolve()
      } catch (e) {
        const container = document.getElementsByClassName('modal-content')[0]
        const errorMessageElement = container.getElementsByClassName('error-message')[0]
        if (!errorMessageElement) {
          const errorBannerHtml = errorHtml.replace('$ERROR_MESSAGE', e)
          purchaseButton.insertAdjacentHTML('afterend', errorBannerHtml.trim())
        } else {
          errorMessageElement.innerHTML = e
        }
        console.error(e)
      }
    }
  })
}

export {
  showAccessPassModal,
}

