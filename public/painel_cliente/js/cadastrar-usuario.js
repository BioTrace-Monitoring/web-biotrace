const formularioCadastro = document.getElementById("formulario-cadastro");
const campoCargo = document.getElementById("ipt_cargo_user");
const mensagemCadastro = document.getElementById("mensagem-cadastro");
const botaoCadastro = document.getElementById("btn_cadastrar_usuario");
const telaSucessoCadastro = document.getElementById("cadastro-sucesso");
const textoSucessoCadastro = document.getElementById("mensagem-sucesso-cadastro");
let temporizadorSucesso;

function somenteDigitos(valor) {
    return valor.replace(/\D/g, "");
}

function mascararCpf(valor) {
    return somenteDigitos(valor).slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mascararTelefone(valor) {
    const digitos = somenteDigitos(valor).slice(0, 11);
    if (digitos.length <= 2) return digitos ? `(${digitos}` : "";
    if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    if (digitos.length <= 10) {
        return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    }
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

function mascararData(valor) {
    const digitos = somenteDigitos(valor).slice(0, 8);
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function exibirMensagem(texto, sucesso = false) {
    mensagemCadastro.textContent = texto;
    mensagemCadastro.classList.toggle("sucesso", sucesso);
    mensagemCadastro.hidden = !texto;
}

function exibirSucessoCadastro(nome) {
    textoSucessoCadastro.textContent = `O cadastro de ${nome} foi concluído com sucesso.`;
    telaSucessoCadastro.classList.remove("ativo");
    void telaSucessoCadastro.offsetWidth;
    telaSucessoCadastro.classList.add("ativo");

    window.clearTimeout(temporizadorSucesso);
    temporizadorSucesso = window.setTimeout(function () {
        telaSucessoCadastro.classList.remove("ativo");
    }, 2200);
}

async function carregarCargos() {
    try {
        const resposta = await fetch("/usuario/cargos");
        if (!resposta.ok) throw new Error("Não foi possível carregar os cargos.");

        const cargos = await resposta.json();
        campoCargo.replaceChildren(new Option("Selecione um cargo", ""));

        cargos.filter((cargo) => Number(cargo.id) !== 1).forEach((cargo) => {
            campoCargo.add(new Option(cargo.nome, cargo.id));
        });

        if (campoCargo.options.length === 1) {
            throw new Error("Nenhum cargo disponível para cadastro.");
        }
    } catch (erro) {
        campoCargo.replaceChildren(new Option("Cargos indisponíveis", ""));
        campoCargo.disabled = true;
        exibirMensagem(erro.message || "Não foi possível carregar os cargos.");
    }
}

function converterDataParaApi(valor) {
    const partes = valor.split("/");
    if (partes.length !== 3 || partes[0].length !== 2 || partes[1].length !== 2 || partes[2].length !== 4) {
        return null;
    }

    const dia = Number(partes[0]);
    const mes = Number(partes[1]);
    const ano = Number(partes[2]);
    const data = new Date(ano, mes - 1, dia);

    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
        return null;
    }

    return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

document.getElementById("ipt_cpf_user").addEventListener("input", function () {
    this.value = mascararCpf(this.value);
});

document.getElementById("ipt_telefone_user").addEventListener("input", function () {
    this.value = mascararTelefone(this.value);
});

document.getElementById("ipt_dt_nasc_user").addEventListener("input", function () {
    this.value = mascararData(this.value);
});

document.querySelectorAll(".password-toggle").forEach(function (botao) {
    botao.addEventListener("click", function () {
        const input = document.getElementById(this.dataset.target);
        const mostrar = input.type === "password";

        input.type = mostrar ? "text" : "password";
        this.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
        this.setAttribute("aria-pressed", String(mostrar));
        this.classList.toggle("visivel", mostrar);
    });
});

formularioCadastro.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    exibirMensagem("");

    const idEmpresa = Number(localStorage.getItem("FK_EMPRESA"));
    const nome = document.getElementById("ipt_nome_user").value.trim();
    const email = document.getElementById("ipt_email_user").value.trim();
    const senha = document.getElementById("ipt_senha_user").value;
    const confirmarSenha = document.getElementById("ipt_conf_senha_user").value;
    const cpf = somenteDigitos(document.getElementById("ipt_cpf_user").value);
    const telefone = somenteDigitos(document.getElementById("ipt_telefone_user").value);
    const dataNascimento = converterDataParaApi(document.getElementById("ipt_dt_nasc_user").value);
    const cargo = Number(campoCargo.value);

    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        exibirMensagem("Não foi possível identificar a empresa da sessão. Entre novamente.");
        return;
    }
    if (!nome || !email || !senha || !campoCargo.value || !cpf || !telefone) {
        exibirMensagem("Preencha todos os campos obrigatórios.");
        return;
    }
    if (!document.getElementById("ipt_email_user").checkValidity()) {
        exibirMensagem("Informe um endereço de e-mail válido.");
        return;
    }
    if (cpf.length !== 11) {
        exibirMensagem("O CPF deve conter 11 dígitos.");
        return;
    }
    if (telefone.length < 10 || telefone.length > 11) {
        exibirMensagem("Informe um telefone com DDD.");
        return;
    }
    if (!dataNascimento) {
        exibirMensagem("Informe uma data de nascimento válida no formato DD/MM/AAAA.");
        return;
    }
    if (senha.length < 8) {
        exibirMensagem("A senha deve ter pelo menos 8 caracteres.");
        return;
    }
    if (senha !== confirmarSenha) {
        exibirMensagem("As senhas não coincidem.");
        return;
    }

    botaoCadastro.disabled = true;
    botaoCadastro.textContent = "Cadastrando...";

    try {
        const resposta = await fetch(`/usuario/${idEmpresa}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
                nomeServer: nome,
                emailServer: email,
                senhaServer: senha,
                cargoServer: cargo,
                cpfServer: cpf,
                dtNascimentoServer: dataNascimento,
                telefoneServer: telefone
            })
        });

        const conteudo = await resposta.text();
        let resultado;
        try {
            resultado = JSON.parse(conteudo);
        } catch {
            resultado = { mensagem: conteudo };
        }

        if (!resposta.ok) {
            throw new Error(resultado.mensagem || resultado.erro || conteudo || "Não foi possível cadastrar o usuário.");
        }

        exibirMensagem("");
        exibirSucessoCadastro(nome);
        formularioCadastro.reset();
    } catch (erro) {
        exibirMensagem(erro.message || "Não foi possível cadastrar o usuário. Tente novamente.");
    } finally {
        botaoCadastro.disabled = false;
        botaoCadastro.textContent = "Cadastrar usuário";
    }
});

carregarCargos();