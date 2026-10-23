// Funções usadas pelas telas de modelos, lotes e equipamentos.
function obterEmpresaCadastro() {
    var idEmpresa = Number(localStorage.getItem('FK_EMPRESA'));
    if (!Number.isSafeInteger(idEmpresa) || idEmpresa <= 0) {
        throw new Error('Empresa não encontrada. Faça login novamente.');
    }
    return idEmpresa;
}

async function requisitarCadastro(url, dados, metodo) {
    var opcoes = {};
    if (dados !== undefined) {
        opcoes.method = metodo || 'POST';
        opcoes.headers = { 'Content-Type': 'application/json' };
        opcoes.body = JSON.stringify(dados);
    }
    var resposta;
    try {
        resposta = await fetch(url, opcoes);
    } catch (erro) {
        throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
    }
    var resultado;
    try {
        resultado = await resposta.json();
    } catch (erro) {
        throw new Error('O servidor não retornou uma resposta válida. Tente novamente.');
    }
    if (!resposta.ok || !resultado.sucesso) {
        throw new Error(resultado.mensagem || resultado.erro || 'Não foi possível concluir a operação.');
    }
    return resultado;
}

function mostrarAvisoCadastro(texto, tipo) {
    var aviso = document.getElementById('aviso-cadastro');
    aviso.dataset.tipo = tipo;
    aviso.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
    aviso.textContent = (tipo === 'sucesso' ? '✓ ' : '! ') + texto;
    aviso.hidden = false;
    aviso.scrollIntoView({ block: 'nearest' });
}

function adicionarOpcaoCadastro(selecao, valor, texto) {
    var opcao = document.createElement('option');
    opcao.value = valor;
    opcao.textContent = texto;
    selecao.appendChild(opcao);
}

function adicionarCelulaCadastro(linha, texto) {
    var celula = document.createElement('td');
    celula.textContent = texto;
    linha.appendChild(celula);
    return celula;
}
