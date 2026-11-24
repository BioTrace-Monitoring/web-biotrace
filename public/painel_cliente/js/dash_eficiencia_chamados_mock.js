window.BioTraceMockData = (() => {
    const hoje = new Date();

    function dataAntesMeses(meses, dia) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - meses, dia || hoje.getDate());
        return data.toISOString();
    }

    const bases = [
        { id: "base-paulista", nome: "Base Paulista", lat: -23.5627, lng: -46.6541 },
        { id: "base-morumbi", nome: "Base Morumbi", lat: -23.6006, lng: -46.7183 },
        { id: "base-vila-mariana", nome: "Base Vila Mariana", lat: -23.5898, lng: -46.6361 }
    ];

    const hospitais = [
        { id: "hospital-paulista", nome: "Hospital Paulista", unidade: "Bela Vista", lat: -23.5552, lng: -46.6478, equipamento: "BT-4091" },
        { id: "hospital-sirio", nome: "Hospital Sírio-Libanês", unidade: "Centro", lat: -23.5575, lng: -46.6528, equipamento: "BT-2048" },
        { id: "hospital-morumbi", nome: "Hospital do Morumbi", unidade: "Morumbi", lat: -23.5991, lng: -46.7177, equipamento: "BT-7712" },
        { id: "hospital-santa-catarina", nome: "Hospital Santa Catarina", unidade: "Paulista", lat: -23.5671, lng: -46.6547, equipamento: "BT-1884" },
        { id: "hospital-sabara", nome: "Hospital Sabará", unidade: "Vila Nova Conceição", lat: -23.5887, lng: -46.6737, equipamento: "BT-3320" }
    ];

    const funcionarios = [
        {
            id: "ana",
            nome: "Ana Souza",
            cargo: "Técnica de equipamentos",
            baseId: "base-paulista",
            chamados: [
                { id: "BT-4091-1", equipamento: "BT-4091", hospitalId: "hospital-paulista", data: dataAntesMeses(0, 18), tempoLocal: 136, deslocamento: 61 },
                { id: "BT-2048-2", equipamento: "BT-2048", hospitalId: "hospital-sirio", data: dataAntesMeses(1, 8), tempoLocal: 188, deslocamento: 54 },
                { id: "BT-7712-3", equipamento: "BT-7712", hospitalId: "hospital-morumbi", data: dataAntesMeses(2, 21), tempoLocal: 118, deslocamento: 72 },
                { id: "BT-1884-4", equipamento: "BT-1884", hospitalId: "hospital-santa-catarina", data: dataAntesMeses(3, 12), tempoLocal: 212, deslocamento: 48 },
                { id: "BT-3320-5", equipamento: "BT-3320", hospitalId: "hospital-sabara", data: dataAntesMeses(5, 4), tempoLocal: 145, deslocamento: 67 }
            ]
        },
        {
            id: "carlos",
            nome: "Carlos Mendes",
            cargo: "Engenheiro clínico",
            baseId: "base-morumbi",
            chamados: [
                { id: "BT-7712-6", equipamento: "BT-7712", hospitalId: "hospital-morumbi", data: dataAntesMeses(0, 16), tempoLocal: 228, deslocamento: 38 },
                { id: "BT-4091-7", equipamento: "BT-4091", hospitalId: "hospital-paulista", data: dataAntesMeses(1, 11), tempoLocal: 176, deslocamento: 44 },
                { id: "BT-3320-8", equipamento: "BT-3320", hospitalId: "hospital-sabara", data: dataAntesMeses(2, 9), tempoLocal: 198, deslocamento: 58 },
                { id: "BT-2048-9", equipamento: "BT-2048", hospitalId: "hospital-sirio", data: dataAntesMeses(4, 23), tempoLocal: 242, deslocamento: 49 }
            ]
        },
        {
            id: "bia",
            nome: "Beatriz Lima",
            cargo: "Técnica de equipamentos",
            baseId: "base-vila-mariana",
            chamados: [
                { id: "BT-1884-10", equipamento: "BT-1884", hospitalId: "hospital-santa-catarina", data: dataAntesMeses(0, 7), tempoLocal: 92, deslocamento: 35 },
                { id: "BT-3320-11", equipamento: "BT-3320", hospitalId: "hospital-sabara", data: dataAntesMeses(1, 14), tempoLocal: 104, deslocamento: 41 },
                { id: "BT-2048-12", equipamento: "BT-2048", hospitalId: "hospital-sirio", data: dataAntesMeses(3, 19), tempoLocal: 126, deslocamento: 52 },
                { id: "BT-4091-13", equipamento: "BT-4091", hospitalId: "hospital-paulista", data: dataAntesMeses(6, 2), tempoLocal: 88, deslocamento: 46 }
            ]
        },
        {
            id: "ricardo",
            nome: "Ricardo Alves",
            cargo: "Especialista biomédico",
            baseId: "base-paulista",
            chamados: [
                { id: "BT-2048-14", equipamento: "BT-2048", hospitalId: "hospital-sirio", data: dataAntesMeses(0, 22), tempoLocal: 390, deslocamento: 75 },
                { id: "BT-4091-15", equipamento: "BT-4091", hospitalId: "hospital-paulista", data: dataAntesMeses(1, 20), tempoLocal: 415, deslocamento: 69 },
                { id: "BT-1884-16", equipamento: "BT-1884", hospitalId: "hospital-santa-catarina", data: dataAntesMeses(2, 5), tempoLocal: 360, deslocamento: 82 },
                { id: "BT-7712-17", equipamento: "BT-7712", hospitalId: "hospital-morumbi", data: dataAntesMeses(7, 15), tempoLocal: 420, deslocamento: 73 }
            ]
        }
    ];

    return { bases, hospitais, funcionarios, criterios: { eficiente: 180, intermediario: 360 } };
})();
