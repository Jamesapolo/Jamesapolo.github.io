const form = document.getElementById("form")
const inputNome = document.getElementById("nomePokemon")
const listaSugestoes = document.getElementById("sugestoes")
const resultado = document.getElementById("resultado")

let pokemon = []

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


function mostrarPokemon(dados) {
    resultado.innerHTML = `
        <h1 class="pokemon">${dados.name}</h1> <span class="pokemonID">${dados.idPokemon}</span>
        <img class="pokemonIMG" src="${dados.sprites.other["official-artwork"].front_default}" alt="${dados.name}">
        `
        console.log(dados)
}

function mostrarErro(mensagem) {
    resultado.innerHTML = `<p class="erro">${mensagem}</p>`
}


async function pesquisar(nome) {
    try {
        const dados = await buscarPokemon(nome)
        mostrarPokemon(dados)
    } catch (erro) {
        console.log(erro)
        mostrarErro("Não foi possível encontrar esse Pokémon. Verifique o Nome do Pokemon.")
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

carregarNomes()