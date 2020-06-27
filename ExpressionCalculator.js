function ExpressionCalculator(expression) {
    this.expression = expression.toLowerCase() // удаляем из выражения пробельные символы

    this.InitFunctions() // инциализируем функции
    this.InitBinaryFunctions() // инициализируем бинарные функции
    this.InitOperators() // инциализируем операторы
    this.InitConstants() // инициализируем константы
    this.InitRegExp() // инициализируем регулярное выражение
    this.SplitToLexemes() // разбиваем на лексемы
    this.ConvertToRPN() // получаем польскую запись
}

// инициализация функций
ExpressionCalculator.prototype.InitFunctions = function() {
    this.functions = {}

    this.functions["sin"] = Math.sin
    this.functions["cos"] = Math.cos
    this.functions["tan"] = Math.tan
    this.functions["tg"] = Math.tan
    this.functions["cot"] = function(x) { return 1.0 / Math.tan(x) }
    this.functions["ctg"] = function(x) { return 1.0 / Math.tan(x) }

    this.functions["sinh"] = Math.sinh
    this.functions["sh"] = Math.sinh
    this.functions["cosh"] = Math.cosh
    this.functions["ch"] = Math.cosh
    this.functions["tanh"] = Math.tanh
    this.functions["th"] = Math.tanh

    this.functions["asin"] = Math.asin
    this.functions["arcsin"] = Math.asin
    this.functions["acos"] = Math.acos
    this.functions["arccos"] = Math.acos
    this.functions["arctg"] = Math.atan
    this.functions["atan"] = Math.atan

    this.functions["ln"] = Math.log
    this.functions["log2"] = Math.log2
    this.functions["lg"] = Math.log10
    this.functions["exp"] = Math.exp
    
    this.functions["sqrt"] = Math.sqrt
    this.functions["cbrt"] = Math.cbrt
    this.functions["abs"] = Math.abs
    this.functions["sign"] = Math.sign
}

// инициализация бинарных функций
ExpressionCalculator.prototype.InitBinaryFunctions = function() {
    this.binaryFunctions = {}

    this.binaryFunctions["max"] = Math.max
    this.binaryFunctions["min"] = Math.min
    this.binaryFunctions["log"] = function(x, y) { return Math.log(y) / Math.log(x) }
    this.binaryFunctions["pow"] = function(x, y) { return Math.pow(x, y) }
    this.binaryFunctions["root"] = function(x, y) { return Math.pow(y, 1.0 / x) }
}

// инициализация операций
ExpressionCalculator.prototype.InitOperators = function() {
    this.operators = {}

    this.operators["+"] = { priority: 1, isRight: false, f: function(x, y) { return x + y }}
    this.operators["-"] = { priority: 1, isRight: false, f: function(x, y) { return x - y }}
    this.operators["*"] = { priority: 2, isRight: false, f: function(x, y) { return x * y }}
    this.operators["/"] = { priority: 2, isRight: false, f: function(x, y) { return x / y }}
    this.operators["%"] = { priority: 2, isRight: false, f: function(x, y) { return x % y }}
    this.operators["^"] = { priority: 3, isRight: true, f: function(x, y) { return Math.pow(x, y) }}
}

// инициализация констант
ExpressionCalculator.prototype.InitConstants = function() {
    this.constants = {}

    this.constants["pi"] = Math.PI
    this.constants["e"] = Math.E
    this.constants["ln2"] = Math.LN2
    this.constants["ln10"] = Math.LN10
    this.constants["sqrt2"] = Math.SQRT2
}

// инициализация регулярного выражения
ExpressionCalculator.prototype.InitRegExp = function() {
    let number = "\\d+\\.\\d+|\\d+" // вещественные числа
    let operations = Object.keys(this.operators).map(function(x) { return "\\" + x }).join("|") // операции
    let functions = Object.keys(this.functions).join("|") // функции
    let binaryFunctions = Object.keys(this.binaryFunctions).join("|") // бинарные функции
    let constants = Object.keys(this.constants).join("|") // константы
    let variables = "[a-z][a-z\\d]*" // переменные

    this.regexp = new RegExp(number + "|\\(|\\)|,|" + operations + "|" + functions + "|" + binaryFunctions + "|" + constants + "|" + variables, "gi")
}

// парсинг на лексемы с проверкой на корректность
ExpressionCalculator.prototype.SplitToLexemes = function() {
    this.lexemes = this.expression.match(this.regexp) // разбиваем на лексемы

    if (this.lexemes.join("") != this.expression.replace(/\s/g, "")) // если выражения не совпадают
        throw "Unknown characters in expression"; // значит есть некорректные символы
}

// проверка на функцию
ExpressionCalculator.prototype.IsFunction = function(lexeme) {
    return lexeme in this.functions
}

// проверка на бинарную функцию
ExpressionCalculator.prototype.IsBinaryFunction = function(lexeme) {
    return lexeme in this.binaryFunctions
}

// проверка на операцию
ExpressionCalculator.prototype.IsOperator = function(lexeme) {
    return lexeme in this.operators
}

// проверка на константу
ExpressionCalculator.prototype.IsConstant = function(lexeme) {
    return lexeme in this.constants
}

// проверка на число
ExpressionCalculator.prototype.IsNumber = function(lexeme) {
    return lexeme.match(/^\d+\.\d+|\d+$/gi) != null
}

// проверка на переменную
ExpressionCalculator.prototype.IsVariable = function(lexeme) {
    return lexeme.match(/^[a-z][a-z\d]*/gi) != null
}

// получение приоритета операции
ExpressionCalculator.prototype.GetPriority = function(lexeme) {
    if (this.IsFunction(lexeme) || this.IsBinaryFunction(lexeme))
        return 100

    if (lexeme == "!")
        return 4 // унарный минус

    if (this.IsOperator(lexeme))
        return this.operators[lexeme].priority

    if (lexeme == ",")
        return 0

    return -1
}

// проверка, что текущая лексема менее приоритетна лексемы на вершине стека
ExpressionCalculator.prototype.IsMorePriority = function(curr, top) {
    if (!this.IsOperator(curr) || !this.operators[curr].isRight)
        return this.GetPriority(top) >= this.GetPriority(curr)

    return this.GetPriority(top) > this.GetPriority(curr)
}

// получение польской записи
ExpressionCalculator.prototype.ConvertToRPN = function() {
    this.rpn = []
    this.variables = {}
    let stack = []
    let mayUnary = true

    for (let lexeme of this.lexemes.values()) {
        if (this.IsNumber(lexeme) || this.IsConstant(lexeme)) {
            this.rpn.push(lexeme)
            mayUnary = false
        }
        else if (this.IsFunction(lexeme) || this.IsBinaryFunction(lexeme)) {
            stack.push(lexeme)
            mayUnary = true
        }
        else if (this.IsVariable(lexeme)) {
            this.rpn.push(lexeme)
            this.variables[lexeme] = 0
            mayUnary = false
        }
        else if (lexeme == ",") {
            while (stack.length > 0 && stack[stack.length - 1] != "(")
                this.rpn.push(stack.pop())

            if (stack.length == 0)
                throw "Incorrect expression"
        }
        else if (this.IsOperator(lexeme)) {
            if (lexeme == "-" && mayUnary)
                lexeme = "!"; // унарный минус

            while (stack.length > 0 && this.IsMorePriority(lexeme, stack[stack.length - 1]))
                this.rpn.push(stack.pop())

            stack.push(lexeme)
            mayUnary = lexeme == "^"
        }
        else if (lexeme == "(") {
            stack.push(lexeme)
            mayUnary = true
        }
        else if (lexeme == ")") {
            while (stack.length > 0 && stack[stack.length - 1] != "(")
                this.rpn.push(stack.pop())

            if (stack.length == 0)
                throw "Incorrect expression: brackets are disbalanced"

            stack.pop()

            if (this.IsFunction(stack[stack.length - 1]))
                this.rpn.push(stack.pop())

            mayUnary = false
        }
        else
            throw "Incorrect expression: unknown lexeme '" + lexeme + "'"
    }

    while (stack.length > 0) {
        if (stack[stack.length - 1] == "(")
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
                throw "Unable to evaluate operator '" + lexeme + "'"

            let arg2 = stack.pop()
            let arg1 = stack.pop()

            stack.push(this.operators[lexeme].f(arg1, arg2))
        }
        else if (this.IsFunction(lexeme)) {
            if (stack.length < 1)
                throw "Unable to evaluate function '" + lexeme + "'"

            let arg = stack.pop()
            stack.push(this.functions[lexeme](arg))
        }
        else if (this.IsBinaryFunction(lexeme)) {
            if (stack.length < 2)
                throw "Unable to evaluate function '" + lexeme + "'"

            let arg2 = stack.pop()
            let arg1 = stack.pop()

            stack.push(this.binaryFunctions[lexeme](arg1, arg2))
        }
        else if (lexeme == "!") {
            if (stack.length < 1)
                throw "Unable to evaluate unary minus"

            stack.push(-stack.pop())
        }
        else if (this.IsConstant(lexeme)) {
            stack.push(this.constants[lexeme])
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