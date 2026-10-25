function normalizarCargo(cargo) {
    return (cargo || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function obterCargoDaSessao() {
    const cargoSalvo = localStorage.getItem("CARGO_USUARIO");
    if (cargoSalvo) return cargoSalvo;

    try {
        const token = localStorage.getItem("token");
        if (!token) return "";
        const payloadCodificado = token.split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
        const payloadBase64 = payloadCodificado.padEnd(Math.ceil(payloadCodificado.length / 4) * 4, "=");
        const payloadJson = decodeURIComponent(atob(payloadBase64).split("").map((caractere) => {
            return `%${caractere.charCodeAt(0).toString(16).padStart(2, "0")}`;
        }).join(""));
        const payload = JSON.parse(payloadJson);
        return payload.cargo || "";
    } catch {
        return "";
    }
}

const cargoAtual = normalizarCargo(obterCargoDaSessao());
window.bioTraceAccess = {
    cargo: cargoAtual,
    podeCadastrarHospital: cargoAtual === "administrador",
    podeCadastrarUsuario: cargoAtual === "administrador" || cargoAtual === "gestor",
    cargosPermitidos: cargoAtual === "administrador"
        ? ["administrador", "gestor", "analista"]
        : cargoAtual === "gestor"
            ? ["analista"]
            : []
};

function configurarPermissoesVisuais() {
    const acesso = window.bioTraceAccess;
    const linkHospital = document.querySelector('a[href="hospitais.html"]');
    const linkUsuario = document.querySelector('a[href="cadastrar-usuario.html"]');
    const tituloCadastros = document.querySelector(".nav-title-spacing");

    if (linkHospital && !acesso.podeCadastrarHospital) linkHospital.style.display = "none";
    if (linkUsuario && !acesso.podeCadastrarUsuario) linkUsuario.style.display = "none";
    if (tituloCadastros && !acesso.podeCadastrarHospital && !acesso.podeCadastrarUsuario) {
        tituloCadastros.style.display = "none";
    }

    const paginaAtual = window.location.pathname.split("/").pop();
    if (["hospitais.html", "editar-hospital.html"].includes(paginaAtual) && !acesso.podeCadastrarHospital) {
        window.location.replace("index.html");
    }
    if (["cadastrar-usuario.html", "listar-usuarios.html", "editar-usuario.html"].includes(paginaAtual) && !acesso.podeCadastrarUsuario) {
        window.location.replace("index.html");
    }
}

function configurarUsuario() {
    const nome = (localStorage.getItem('NOME_USUARIO') || '').trim() || 'Usuário BioTrace';
    const email = (localStorage.getItem('EMAIL_USUARIO') || 'usuario@biotrace.com');
    const partes = nome.split(/\s+/).filter(Boolean);
    const iniciais = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : (partes[0] || 'BT').slice(0, 2);
    document.getElementById('nome_cliente').textContent = nome;
    document.getElementById('email_cliente').textContent = email;
    document.getElementById('usuario_avatar').textContent = iniciais.toUpperCase();
}

function configurarSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuButton = document.getElementById('menuButton');

    const fechar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        if (menuButton.hasAttribute('aria-expanded')) menuButton.setAttribute('aria-expanded', 'false');
    }

    menuButton.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        if (menuButton.hasAttribute('aria-expanded')) menuButton.setAttribute('aria-expanded', 'true');
    });
    
    document.getElementById('sidebarClose').addEventListener('click', fechar);

    overlay.addEventListener('click', fechar);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            fechar();
        }
    });
}

function configurarLogout() {
    document.getElementById('btnSair').addEventListener('click', () => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '../login.html';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    configurarPermissoesVisuais();
    configurarUsuario();
    configurarSidebar();
    configurarLogout();
});
