const form = document.getElementById("form")
const inputNome = document.getElementById("nomePokemon")
const listaSugestoes = document.getElementById("sugestoes")
const resultado = document.getElementById("resultado")

let pokemon = []

function pegarIdUrl(url) {
    const partes = url.split("/")
    return partes[partes.length - 2]
}

async function carregarNomes() {
    try {
        const resposta = await fetch("https://pokeapi.co/api/v2/pokemon?limit=2000")

        if (!resposta.ok) {
            throw new Error("Erro ao carregar a lista")
        }

        const dados = await resposta.json()
        

        for (let i = 0; i < dados.results.length; i++) {
            pokemon.push(dados.results[i].name)
        }
    } catch (erro) {
        console.log(erro)
        console.log("Não foi possível carregar as sugestões")
    }
}


function mostrarSugestoes(texto) {
    listaSugestoes.innerHTML = ""

    if (texto === "") {
        return
    }

    texto = texto.replaceAll(" ", "-")

    let quantidade = 0

    for (let i = 0; i < pokemon.length; i++) {
        if (pokemon[i].includes(texto)) {
            const item = document.createElement("li")
            item.textContent = pokemon[i]

            item.addEventListener("click", function () {
                inputNome.value = pokemon[i]
                listaSugestoes.innerHTML = ""
                pesquisar(pokemon[i])
            })

            listaSugestoes.appendChild(item)
            quantidade++
        }

        if (quantidade === 8) {
            break
        }
    }
}


async function buscarPokemon(nome) {
    const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${nome}`)

    if (!resposta.ok) {
        throw new Error("Pokémon não encontrado")
    }

    return await resposta.json()
}


function mostrarPokemon(dados, tipos, fraquezas) {
    const numero = pegarIdUrl(dados.species.url)

    let tiposHTML = ""

    for (let i = 0; i < tipos.length; i++) {
        tiposHTML = tiposHTML + criarIconeTipo(tipos[i].icone, tipos[i].nome)
    }

    let fraquezasHTML = ""

    for (let i = 0; i < fraquezas.length; i++) {
        fraquezasHTML = fraquezasHTML + `
            <div class="fraqueza">
                ${criarIconeTipo(fraquezas[i].icone, fraquezas[i].nome)}
                <span>${fraquezas[i].multiplicador}x</span>
            </div>
        `
    }

    resultado.innerHTML = `
        <div class="cabecalho">
            <h2 class="pokemon">${dados.name}</h2>
            <span class="pokemonID">N°0${numero}</span>
        </div>
        <img class="pokemonIMG" src="${dados.sprites.other["official-artwork"].front_default}" alt="${dados.name}">
        <div class="infoTipos">
            <h3>Tipo</h3>
            <div class="linhaTipos">${tiposHTML}</div>
            <h3>Fraquezas</h3>
            <div class="linhaTipos">${fraquezasHTML}</div>
        </div>
    `
}

function mostrarErro(mensagem) {
    resultado.innerHTML = `<p class="erro">${mensagem}</p>`
}


async function pesquisar(nome) {
    resultado.innerHTML = "<p>Carregando...</p>"

    try {
        const dados = await buscarPokemon(nome)
        const tipos = await buscarTipoDoPokemon(dados.types)
        const fraquezas = await buscarFraquezas(dados.types)
        mostrarPokemon(dados, tipos, fraquezas)
    } catch (erro) {
        console.log(erro)
        mostrarErro("Não foi possível encontrar esse Pokémon. Verifique o nome do Pokémon.")
    }
}


inputNome.addEventListener("input", function () {
    const texto = inputNome.value.toLowerCase().trim()
    mostrarSugestoes(texto)
})


form.addEventListener("submit", function (evento) {
    evento.preventDefault()

    const nome = inputNome.value.toLowerCase().trim().replaceAll(" ", "-")
    listaSugestoes.innerHTML = ""

    if (nome === "") {
        mostrarErro("Digite o nome de um Pokémon.")
        return
    }

    pesquisar(nome)
})

const cacheTipos = {}

async function buscarTipo(url) {
    if (cacheTipos[url] !== undefined) {
        return cacheTipos[url]
    }

    const resposta = await fetch(url)

    if (!resposta.ok) {
        throw new Error("Tipo não encontrado!")
    }

    const dadosTipo = await resposta.json()
    cacheTipos[url] =  dadosTipo
    return dadosTipo
}

function pegarIconeTipo(dadosTipo) {
    // console.log(dadosTipo.sprites)
    return dadosTipo.sprites["generation-ix"]["champions"].name_icon
    
}


async function buscarTipoDoPokemon(tipos) {
    const lista = []

    for(let i = 0; i < tipos.length; i++) {
        const dadosTipo = await buscarTipo(tipos[i].type.url)

        lista.push({
            nome: tipos[i].type.name,
            icone: pegarIconeTipo(dadosTipo)
        })
    }
    return lista
}


function aplicarMultiplicador(multiplicadores, lista, fator) {
    for (let i = 0; i < lista.length; i++) {
        const nome = lista[i].name

        if (multiplicadores[nome] === undefined) {
            multiplicadores[nome] = { url: lista[i].url, valor: 1}
        }
        multiplicadores[nome].valor = multiplicadores[nome].valor * fator
        
    }
}

async function buscarFraquezas(tipos) {
    const multiplicadores = {}

    for (let i = 0; i < tipos.length; i++) {
        const dadosTipo = await buscarTipo(tipos[i].type.url)
        const relacoes = dadosTipo.damage_relations

        aplicarMultiplicador(multiplicadores, relacoes.double_damage_from, 2)
        aplicarMultiplicador(multiplicadores, relacoes.half_damage_from, 0.5)
        aplicarMultiplicador(multiplicadores, relacoes.no_damage_from, 0)
    }

    const fraquezas = []

    for (const nome in multiplicadores) {
        if (multiplicadores[nome].valor > 1) {
            const dadosTipo = await buscarTipo(multiplicadores[nome].url)

            fraquezas.push({
                nome: nome,
                icone: pegarIconeTipo(dadosTipo),
                multiplicador: multiplicadores[nome].valor
            })
        }
    }

    return fraquezas
}

function criarIconeTipo(icone, nome) {
    if (!icone === null) {
        return `<span class="semIcone">${nome}</span>`
    }

    return `<img class="iconeTipo" src="${icone}" alt="${nome}" title="${nome}">`
}

carregarNomes()