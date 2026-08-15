const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } = require('docx');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "BeepApp - Cenário de Teste de Usuário (UX Scenario)",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Resumo do Aplicativo: ", bold: true }),
                    new TextRun("O BeepApp é um aplicativo interativo de 'segunda tela' feito para Smart TVs. Ele permite que os usuários interajam com transmissões de TV ao vivo, participem de enquetes em tempo real e ganhem recompensas assistindo a anúncios."),
                ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
                text: "Cenário 1: Tela Principal e Interação ao Vivo",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                children: [
                    new ImageRun({
                        data: fs.readFileSync('D:/CLIENTES/BeepApp/Projeto/AppWeb/lg_store_assets/screenshot_1.png'),
                        transformation: { width: 600, height: 337 },
                    }),
                ],
            }),
            new Paragraph({ text: "- Passo 1: O usuário abre o aplicativo através do menu principal da TV." }),
            new Paragraph({ text: "- Passo 2: O aplicativo mostra a tela principal com a transmissão ao vivo rolando no lado esquerdo." }),
            new Paragraph({ text: "- Passo 3: O usuário usa as setinhas do controle remoto para participar da enquete interativa no painel da direita." }),
            new Paragraph({ text: "" }),
            new Paragraph({
                text: "Cenário 2: Propaganda e Recompensas (QR Code)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                children: [
                    new ImageRun({
                        data: fs.readFileSync('D:/CLIENTES/BeepApp/Projeto/AppWeb/lg_store_assets/screenshot_2.png'),
                        transformation: { width: 600, height: 337 },
                    }),
                ],
            }),
            new Paragraph({ text: "- Passo 1: Após interagir com sucesso, o usuário recebe uma tela de recompensa com um anúncio." }),
            new Paragraph({ text: "- Passo 2: O usuário aponta a câmera do celular para o QR Code gigante na tela da TV para resgatar seus pontos do Beep." }),
            new Paragraph({ text: "" }),
            new Paragraph({
                text: "Cenário 3: Sincronização e Reconhecimento de Áudio",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                children: [
                    new ImageRun({
                        data: fs.readFileSync('D:/CLIENTES/BeepApp/Projeto/AppWeb/lg_store_assets/screenshot_3.png'),
                        transformation: { width: 600, height: 337 },
                    }),
                ],
            }),
            new Paragraph({ text: "- Passo 1: O usuário navega até a funcionalidade de 'Reconhecimento'." }),
            new Paragraph({ text: "- Passo 2: O aplicativo 'escuta' o áudio da TV para sincronizar o conteúdo interativo automaticamente." }),
            new Paragraph({ text: "- Passo 3: A tela exibe uma animação mostrando que o áudio está sendo processado com sucesso." }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync('D:/CLIENTES/BeepApp/Projeto/AppWeb/lg_store_assets/UX_Scenario_BeepApp.docx', buffer);
    console.log("Done");
});
