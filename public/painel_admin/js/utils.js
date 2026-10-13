b_usuario.innerHTML = `Olá, ${sessionStorage.NOME_USUARIO}`;

function limparSessao() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "/"
}