document.querySelector('#add-time')
    .addEventListener('click', cloneField)

function cloneField() {
    const newFieldContainer = document.querySelector('.schedule-item').cloneNode(true)

    const fields = newFieldContainer.querySelectorAll('input')

    for(var field of fields) {
        field.value = ""
    }

    document.querySelector('#schedule-items').appendChild(newFieldContainer)
}