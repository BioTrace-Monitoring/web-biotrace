b_usuario.innerHTML = `Olá, ${sessionStorage.NOME_USUARIO}`;

function limparSessao() {
    sessionStorage.clear();
    window.location.href = "/"
}