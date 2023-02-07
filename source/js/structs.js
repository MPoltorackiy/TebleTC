class Input {
    constructor(params) {
        this.element = params.element

        this.type = params.type
        this.dataType = { 'text': String, 'number': Number, 'select': String }[params.dataType]

        this.allowedValues = params.allowedValues

        this.isUnic = params.isUnic

        if (this.dataType === String)
            this.value = String(this.element.value)
        else if (this.dataType === Number)
            this.value = Number(this.element.value)
        else
            this.value = String(this.element.value)


        this.listeners = { change: [] }

        this.setAltValues()
        this.listenOnChange()
    }

    listenOnChange() {
        $(this.element).on('change', e => {
            this.syncValue()

            this.listeners['change'].forEach(func => {
                func(e, this)
            })
        })
    }

    setAltValues() {
        this.prevValue = this.dataType(this.value)
        this.defaultValue = this.dataType(this.value)
    }

    syncValue() {
        if ( this.verifyValue( this.element.value) ) {
            this.prevValue = this.dataType( (JSON.parse( JSON.stringify({value: this.value}) ) ).value)
            this.value = this.dataType(this.element.value)

        } else {
            this.element.value = this.prevValue
        }
    }

    verifyValue(value) {
        if (typeof this.dataType() === typeof value || typeof this.dataType() === typeof this.dataType(value)) {
            if (this.allowedValues !== undefined) {
                if (this.allowedValues.includes(value)) {
                    return true
                    // if (this.isUnic) {
                    //     if (this.linkToUnics.includes(value)) {
                    //         return false
                    //     } else {
                    //         return true
                    //     }
                    // } else {
                    //     return true
                    // }
                } else {
                    return false
                }
            } else {
                return true
            }
        } else {
            return false
        }
    }

    addEventListener(event, callback) {
        if (this.listeners[event] === undefined)
            this.listeners[event] = []

        this.listeners[event].push(callback)
    }
}



class TextInput extends Input {
    constructor(params) {
        super(Object.assign(params, { type: 'text' } ))
    }
}



class NumberInput extends Input {
    constructor(params) {
        super(Object.assign(params, { type: 'number' } ))
    }
}



class SelectInput extends Input {
    constructor(params) {
        super(Object.assign(params, { type: 'select' } ))
    }
}



//



class Table {
    constructor(params) {
        this.element = params.element

        // this.row = params.row
        this.row = {}
        this.row.minNumberOf = params.row.minNumberOf
        this.row.htmlTemplate = params.row.htmlTemplate

        this.row.trsSelector = params.row.trsSelector
        this.row.inputsSelectors = params.row.inputsSelectors

        this.row.inputsTypes = params.row.inputsTypes
        this.row.unicInputs = params.row.unicInputs

        this.row.dataForSelectInputs = params.row.dataForSelectInputs
        this.row.importOptionsFrom = params.row.importOptionsFrom

        this.unicValues = []
        this.rows = {}

        this.listeners = {}

        this.initRows()
        this.listenForChangesInDataRows()
    }

    initRows() {
        Array.from( $(this.row.trsSelector) ).forEach(tr => {
            this.rows[tr.id] = this.getRowBySelectors(tr.id)
        })
    }

    getRowBySelectors(id) {
        let row = { id: Number(id) }

        Object.keys(this.row.inputsSelectors).forEach(inputName => {
            let input

            if (this.row.inputsTypes[inputName] === 'text')
                input = new TextInput({ element: $(this.row.inputsSelectors[inputName].replace('{tr-id}', id))[0], dataType: this.row.inputsTypes[inputName] })
            else if (this.row.inputsTypes[inputName] === 'number')
                input = new NumberInput({ element: $(this.row.inputsSelectors[inputName].replace('{tr-id}', id))[0], dataType: this.row.inputsTypes[inputName] })
            else if (this.row.inputsTypes[inputName] === 'select')
                input = new SelectInput({ element: $(this.row.inputsSelectors[inputName].replace('{tr-id}', id))[0], dataType: this.row.inputsTypes[inputName] })
            else
                input = new TextInput({ element: $(this.row.inputsSelectors[inputName].replace('{tr-id}', id))[0], dataType: this.row.inputsTypes[inputName] })

            if (this.row.unicInputs !== undefined )
                input.isUnic = this.row.unicInputs.includes(inputName)

            row[inputName] = input
        })

        return row
    }

    updateRows() {
        Object.values(this.rows).forEach(row => {
            this.updateRowBySelectors(row)
        })
    }

    updateRowBySelectors(row) {
        Object.values(row.id).forEach(input => {
            input.syncValue()
        })
    }

    sortRows() {
        let rowSelectors = Array.from( $(this.row.trsSelector) )
        rowSelectors.sort((a, b) => {
            let compA = Number($(a).attr('id').toUpperCase())
            let compB = Number($(b).attr('id').toUpperCase())
            return (compA < compB) ? -1 : (compA > compB) ? 1 : 0
        })

        $.each(rowSelectors, (idx, itm) => {
            $(this.element).append(itm)
        })
    }

    appendRow(id) {
        if (id === undefined) {
            let ids = []
            let max = 0

            Object.values(this.rows).forEach(row => {
                ids.push(row.id)
                max = row.id > max ? row.id : max
            })

            for(let i = 0; i < max; i++) {
                if (!ids.includes(i)) {
                    id = i
                    break
                }
            }

            if (id === undefined)
                id = Object.keys(this.rows).length
        }



        let rowHtml = this.row.htmlTemplate
        .replaceAll('{id}', id)
        .replaceAll('{number}', id + 1)

        if (this.row.importOptionsFrom !== undefined) {
            Object.keys(this.row.importOptionsFrom).forEach(key => {
                let optionsHtml = ''

                let replacement = this.row.importOptionsFrom[key]

                Array.from( $(replacement.byOptionsUsingSelector) ).forEach(optionDataInput => {
                    optionsHtml += replacement.optionHtmlTemplate
                    .replace('{id}', optionDataInput.parentNode.parentNode.id)
                    .replace('{value}', optionDataInput.value)
                    .replace('{text}', optionDataInput.value)
                })

                rowHtml = rowHtml.replaceAll(replacement.replaceInTrPool, optionsHtml)
            })
        }



        // .replaceAll('{options}')

        $(this.element).append(rowHtml)
        this.sortRows()

        // this.rows.push( this.getRowBySelectors(id) )
        this.rows[id] = this.getRowBySelectors(id)
        // this.rows[id] = this.getRowBySelectors(id)

        if (this.row.dataForSelectInputs !== undefined) {
            this.appendOptionToLinkedSelectInputs(id)
        }

    }

    removeRow(id) {
        let rowId

        Object.values(this.rows).forEach((row, index) => {
            if (row.id === Number(id)) {
                rowId = index
            }
        })


        if (this.row.dataForSelectInputs !== undefined) {
            this.removeOptionToLinkedSelectInputs(rowId ?? id)
        }

        console.log('')
        console.log('rows before:', this.rows)
        console.log('deleting:', this.rows[rowId ?? id])
        console.log('rows now:', this.rows)
        console.log('log:', rowId, id)
        $(this.element).find('tr#' + (id)).remove()
        delete this.rows[rowId ?? id]
    }

    appendOptionToLinkedSelectInputs(id) {
        Object.keys(this.row.dataForSelectInputs).forEach(input => {
            this.row.dataForSelectInputs[input].selects.forEach(select => {
                Array.from($(select)).forEach(selectInput => {
                    console.log(this.rows)
                    console.log(this.rows[id][input].value)

                    let prevId = 0

                    Object.values(this.rows).forEach(row => {
                        if (row.id > prevId && row.id < id)
                            prevId = row.id
                    })

                    console.log('id:', id)
                    console.log('input:', input)
                    console.log('select:', select)
                    console.log('selectInput:', selectInput)

                    $(selectInput).find(this.row.dataForSelectInputs[input].optionPrevSelector
                        .replace('{id}', this.rows[prevId].id)
                        .replace('{value}', this.rows[prevId][input].value)
                        ).after(this.row.dataForSelectInputs[input].optionHtmlTemplate
                        .replaceAll('{id}', id)
                        .replaceAll('{value}', this.rows[id][input].value)
                        .replaceAll('{text}', this.rows[id][input].value)
                    )
                })
            })
        })
    }

    removeOptionToLinkedSelectInputs(id) {
        Object.keys(this.row.dataForSelectInputs).forEach(input => {
            this.row.dataForSelectInputs[input].selects.forEach(select => {
                Array.from($(select)).forEach(selectInput => {
                    $(selectInput).find(
                        this.row.dataForSelectInputs[input].optionPrevSelector
                        .replace('{value}', this.rows[id][input].value)
                        .replace('{id}', id)
                    ).remove()
                })
            })
        })
    }

    listenForChangesInDataRows() {
        $(this.element).on('change', e => {
            this.updateRows()

            if (this.row.dataForSelectInputs !== undefined) {

                Object.keys(this.row.dataForSelectInputs).forEach(input => {

                    if (this.row.dataForSelectInputs[input].inputId === e.originalEvent.target.id) {
                        Array.from($(this.row.dataForSelectInputs[input].optionPrevSelector
                            .replace('{value}', this.rows[e.originalEvent.target.parentNode.parentNode.id][input].prevValue)
                            .replace('{id}', e.originalEvent.target.parentNode.parentNode.id))).forEach(option => {
                                $(option).html(this.rows[e.originalEvent.target.parentNode.parentNode.id][input].value)
                                $(option).attr('value', this.rows[e.originalEvent.target.parentNode.parentNode.id][input].value)
                            })
                    }
                })
            }

            Object.keys(this.listeners).forEach(event => {
                this.listeners[event].forEach(listener => {
                    listener(e)
                })
            })
        })
    }

    clearData() {
        console.log('length:', Object.keys(this.rows).length)
        for (let i = Object.keys(this.rows).length - 1; i >= 0; i--)
            this.removeRow(i)

        for (let i = 0; i < this.row.minNumberOf; i++)
            this.appendRow(i)
    }

    addEventListener(event, callback) {
        if (this.listeners[event] === undefined)
            this.listeners[event] = []

        this.listeners[event].push(callback)
    }
}



class NumerableTable extends Table {
    constructor(params) {
        super(params)

        this.numerableInput = params.numerableInput

        this.listenForChangesInNumOfRows()
    }

    listenForChangesInNumOfRows() {
        this.numerableInput.addEventListener('change', (e, input) => {
            while (Number(input.prevValue) < Number(input.value)) {
                this.appendRow(Number(input.prevValue))
                input.prevValue++
            }

            while (Number(input.prevValue) > Number(input.value)) {
                this.removeRow(Number(input.prevValue) - 1)
                input.prevValue--
            }
        })
    }
}



class CalcableTable extends Table {
    constructor(params) {
        super(params)

        this.calcAppendBtnSelector = params.calcAppendBtnSelector
        this.calcRemoveBtnSelector = params.calcRemoveBtnSelector

        this.listenForChangesInNumOfRows()
    }

    listenForChangesInNumOfRows() {
        $(this.element).on('click', this.calcAppendBtnSelector, e => {
            this.appendRow()
        })

        $(this.element).on('click', this.calcRemoveBtnSelector, e => {
            this.removeRow(Number(e.currentTarget.parentNode.parentNode.parentNode.id))
        })
    }
}



//



class UnhiddableTables {
    constructor(params) {
        this.unhidders = params.unhidders
        this.tables = params.tables

        this.cssClass = params.cssClass

        this.listenOnUnhidderClick()
    }

    listenOnUnhidderClick() {
        let unhiddersList = Object.keys(this.unhidders)
        unhiddersList.forEach(key => {
            $(this.unhidders[key]).on('click', e => {
                if ( $(e.currentTarget).hasClass(this.cssClass) ) {
                    // TODO: clear vesting / unlocking table
                    this.tables[key].clearData()
                    $(this.unhidders[key]).html('+').removeClass(this.cssClass)
                    console.log(this.tables[key])
                    console.log(key)
                    $(this.tables[key].element.parentNode).removeClass(this.cssClass)
                } else {
                    $(this.unhidders[key]).html('-').addClass(this.cssClass)
                    console.log(key)
                    console.log(this.tables)
                    console.log(this.tables[key])
                    console.log(this.tables[key].element)
                    $(this.tables[key].element.parentNode).addClass(this.cssClass)

                    unhiddersList.forEach(key2 => {
                        if (key !== key2) {
                            $(this.unhidders[key2]).html('+').removeClass(this.cssClass)
                            $(this.tables[key2].element.parentNode).removeClass(this.cssClass)
                        }
                    })
                }
            })
        })
    }
}