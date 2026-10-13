function obterUsuarioLogado() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = decodeURIComponent(atob(payloadBase64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(payloadJson);

        // "exp" vem em segundos (padrão JWT), Date.now() retorna milissegundos
        const expirou = payload.exp && payload.exp * 1000 < Date.now();

        if (expirou) {
            localStorage.removeItem('token');
            return null;
        }

        return payload;
    } catch (erro) {
        // Token corrompido ou mal formado
        localStorage.removeItem('token');
        return null;
    }
}

function exigirCargo(cargosPermitidos) {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
        window.location.href = "../login.html";
        return null;
    }

    if (!cargosPermitidos.includes(usuario.cargo)) {
        window.location.href = "../index.html";
        return null;
    }

    return usuario;
}

function redirecionarUsuarioLogado() {
    const usuario = obterUsuarioLogado();

    if (usuario.cargo == "BioTrace") {
        window.location.href = "./painel_admin/index.html";
    } else {
        window.location.href = "./painel_cliente/index.html";
    }
}