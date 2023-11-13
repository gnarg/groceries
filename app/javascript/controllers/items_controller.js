import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    toggle(e) {
      const id = JSON.parse(e.target.dataset.item).id
      const csrfToken = document.querySelector("[name='csrf-token']").content

      fetch(`/items/${id}`, {
          method: 'PUT', // *GET, POST, PUT, DELETE, etc.
          // mode: 'cors', // no-cors, *cors, same-origin
          cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
          // credentials: 'same-origin', // include, *same-origin, omit
          headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({ item: { id: id, purchased: e.target.checked } }) // body data type must match "Content-Type" header
      })
      .then(response => Turbo.visit('/'))
    }
}
