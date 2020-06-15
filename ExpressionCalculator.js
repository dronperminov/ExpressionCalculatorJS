function ExpressionCalculator(expression) {
    this.expression = expression.replace(/\s/g, "").toLowerCase() // удаляем из выражения пробельные символы

    this.InitFunctions() // инциализируем функции
    this.InitOperators() // инциализируем операторы
    this.InitConstants() // инициализируем константы
    this.InitRegExp() // инициализируем регулярное выражение
    this.SplitToLexemes() // разбиваем на лексемы
    this.ConvertToRPN() // получаем польскую запись
}

// инициализация функций
ExpressionCalculator.prototype.InitFunctions = function() {
    this.functions = []

    this.functions.push({ name: "sin", f: Math.sin })
    this.functions.push({ name: "cos", f: Math.cos })
    this.functions.push({ name: "tan", f: Math.tan })
    this.functions.push({ name: "tg", f: Math.tan })
    this.functions.push({ name: "cot", f: function(x) { return 1.0 / Math.tan(x) } })
    this.functions.push({ name: "ctg", f: function(x) { return 1.0 / Math.tan(x) } })

    this.functions.push({ name: "sinh", f: Math.sinh })
    this.functions.push({ name: "sh", f: Math.sinh })
    this.functions.push({ name: "cosh", f: Math.cosh })
    this.functions.push({ name: "ch", f: Math.cosh })
    this.functions.push({ name: "tanh", f: Math.tanh })
    this.functions.push({ name: "th", f: Math.tanh })

    this.functions.push({ name: "asin", f: Math.asin })
    this.functions.push({ name: "arcsin", f: Math.asin })
    this.functions.push({ name: "acos", f: Math.acos })
    this.functions.push({ name: "arccos", f: Math.acos })
    this.functions.push({ name: "arctg", f: Math.atan })
    this.functions.push({ name: "atan", f: Math.atan })

    this.functions.push({ name: "ln", f: Math.log })
    this.functions.push({ name: "log2", f: Math.log2 })
    this.functions.push({ name: "log", f: Math.log10 })
    this.functions.push({ name: "exp", f: Math.exp })
    
    this.functions.push({ name: "sqrt", f: Math.sqrt })
    this.functions.push({ name: "cbrt", f: Math.cbrt })
    this.functions.push({ name: "abs", f: Math.abs })
    this.functions.push({ name: "sign", f: Math.sign })

    this.functionNames = this.functions.map(function(c) { return c.name }) // имена функций
}

// инициализация операций
ExpressionCalculator.prototype.InitOperators = function() {
    this.operators = []

    this.operators.push({ name: "+", priority: 1, f: function(x, y) { return x + y }})
    this.operators.push({ name: "-", priority: 1, f: function(x, y) { return x - y }})
    this.operators.push({ name: "*", priority: 2, f: function(x, y) { return x * y }})
    this.operators.push({ name: "/", priority: 2, f: function(x, y) { return x / y }})
    this.operators.push({ name: "%", priority: 2, f: function(x, y) { return x % y }})
    this.operators.push({ name: "^", priority: 5, f: function(x, y) { return Math.pow(x, y) }})

    this.operatorNames = this.operators.map(function(c) { return c.name }) // имена операций
}

// инициализация констант
ExpressionCalculator.prototype.InitConstants = function() {
    this.constants = []

    this.constants.push({ name: "pi", value: Math.PI })
    this.constants.push({ name: "e", value: Math.E })
    this.constants.push({ name: "ln2", value: Math.LN2 })
    this.constants.push({ name: "ln10", value: Math.LN10 })
    this.constants.push({ name: "sqrt2", value: Math.SQRT2 })

    this.constantNames = this.constants.map(function(c) { return c.name }) // имена констант
}

// инициализация регулярного выражения
ExpressionCalculator.prototype.InitRegExp = function() {
    let number = "\\d+\\.\\d+|\\d+" // ввещественные числа
    let operations = this.operatorNames.map(function(x) { return "\\" + x }).join("|") // операции
    let functions = this.functionNames.join("|") // функции
    let constants = this.constantNames.join("|")
    let variables = "[a-z]+" // ввещественные числа

    this.regexp = new RegExp(number + "|\\(|\\)|" + operations + "|" + functions + "|" + constants + "|" + variables, "gi")
}

// парсинг на лексемы с проверкой на корректность
ExpressionCalculator.prototype.SplitToLexemes = function() {
    this.lexemes = this.expression.match(this.regexp) // разбиваем на лексемы

    if (this.lexemes.join("") != this.expression) // если выражения не совпадают
        throw "Unknown characters in expression"; // значит есть некорректные символы
}

// проверка на функцию
ExpressionCalculator.prototype.IsFunction = function(lexeme) {
    return this.functionNames.indexOf(lexeme) > -1
}

// проверка на операцию
ExpressionCalculator.prototype.IsOperator = function(lexeme) {
    return this.operatorNames.indexOf(lexeme) > -1
}

// проверка на константу
ExpressionCalculator.prototype.IsConstant = function(lexeme) {
    return this.constantNames.indexOf(lexeme) > -1
}

// проверка на число
ExpressionCalculator.prototype.IsNumber = function(lexeme) {
    return lexeme.match(/^\d+\.\d+|\d+$/gi) != null
}

// проверка на переменную
ExpressionCalculator.prototype.IsVariable = function(lexeme) {
    return lexeme.match(/^[a-z]+/gi) != null
}

// получение приоритета операции
ExpressionCalculator.prototype.GetPriority = function(lexeme) {
    if (this.IsOperator(lexeme)) {
        let index = this.operatorNames.indexOf(lexeme)
        return this.operators[index].priority
    }

    if (lexeme == "!")
        return 4 // унарный минус

    return 0
}

// получение польской записи
ExpressionCalculator.prototype.ConvertToRPN = function() {
    this.rpn = []
    this.variables = {}
    let stack = []
    let mayUnary = true

    for (let lexeme of this.lexemes.values()) {
        if (this.IsFunction(lexeme)) {
            stack.push(lexeme)
            mayUnary = true
        }
        else if (this.IsNumber(lexeme) || this.IsConstant(lexeme)) {
            this.rpn.push(lexeme)
            mayUnary = false
        }
        else if (this.IsVariable(lexeme)) {
            this.rpn.push(lexeme)
            this.variables[lexeme] = 0
            mayUnary = false
        }
        else if (lexeme == "(") {
            stack.push(lexeme)
            mayUnary = true
        }
        else if (lexeme == ")") {
            while (stack.length > 0 && stack[stack.length - 1] != "(")
                this.rpn.push(stack.pop())

            if (stack.length == 0)
                throw "Incorrect expression"

            stack.pop()
            mayUnary = false
        }
        else if (this.IsOperator(lexeme)) {
            if (lexeme == "-" && mayUnary)
                lexeme = "!"; // унарный минус

            while (stack.length > 0 && (this.IsFunction(stack[stack.length - 1]) || this.GetPriority(stack[stack.length - 1]) >= this.GetPriority(lexeme)))
                this.rpn.push(stack.pop())

            stack.push(lexeme)
            mayUnary = false
        }
        else
            throw "Incorrect expression: unknown lexeme '" + lexeme + "'"
    }

    while (stack.length > 0) {
        if (!this.IsOperator(stack[stack.length - 1]) && !this.IsFunction(stack[stack.length - 1]) && stack[stack.length - 1] != "!")
            throw "Incorrect expression: brackets are disbalanced"

        this.rpn.push(stack.pop())
    }
}

// обновление значения переменной
ExpressionCalculator.prototype.SetValue = function(name, value) {
    this.variables[name] = value
}

// вычисление выражения
ExpressionCalculator.prototype.Evaluate = function() {
    let stack = []

    for (let lexeme of this.rpn.values()) {
        if (this.IsOperator(lexeme)) {
            if (stack.length < 2)
                throw "Incorrect expression"

            let index = this.operatorNames.indexOf(lexeme)
            let arg2 = stack.pop()
            let arg1 = stack.pop()

            stack.push(this.operators[index].f(arg1, arg2))
        }
        else if (this.IsFunction(lexeme)) {
            if (stack.length < 1)
                throw "Incorrect expression"

            let arg = stack.pop()
            let index = this.functionNames.indexOf(lexeme)
            stack.push(this.functions[index].f(arg))
        }
        else if (lexeme == "!") {
            if (stack.length < 1)
                throw "Incorrect expression"

            stack.push(-stack.pop())
        }
        else if (this.IsConstant(lexeme)) {
            let index = this.constantNames.indexOf(lexeme)
            stack.push(this.constants[index].value)
        }
        else if (this.IsVariable(lexeme)) {
            stack.push(this.variables[lexeme])
        }
        else if (this.IsNumber(lexeme)) {
            stack.push(+lexeme)
        }
        else
            throw "Unknown rpn lexeme '" + lexeme + "'"
    }

    if (stack.length != 1)
        throw "Incorrect expression"

    return stack[0]
}