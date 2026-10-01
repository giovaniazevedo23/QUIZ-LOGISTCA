import sys
import time


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(errors="replace")


def exibir_cabecalho():
    print("=" * 80)
    print(" 🚨  QUIZ AVANÇADO: GESTÃO DE RISCO, PGR, SEGUROS E E-POD EM ALTO VALOR  🚨")
    print("=" * 80)
    print("Instruções: Digite a letra correspondente à sua resposta (A, B, C ou D).\n")


def rodar_quiz():
    questoes = [
        {
            "id": 1,
            "tema": "Gestão de Risco e Protocolos de Escolta",
            "enunciado": "Em uma operação de transporte de eletrônicos de alto valor, o PGR estipula a necessidade de escolta armada em comboio. O veículo sofre uma pane mecânica leve que exige parada momentânea fora do ponto de apoio oficial em rodovia de alto risco. Qual conduta tática imediata é mandatória?",
            "opcoes": {
                "A": "Posicionar a viatura de escolta diretamente na traseira do caminhão a 5 metros para facilitar um reboque rápido.",
                "B": "Liberar o motorista para realizar o conserto mecânico enquanto a escolta faz varredura a 1 km de distância à frente.",
                "C": "Posicionar a viatura em perímetro defensivo de 360 graus/retaguarda tática com desembarque preventivo, mantendo o motorista abrigado na cabine protegida.",
                "D": "Desengatar o semirreboque para trafegar apenas com o cavalo mecânico até a oficina mais próxima, deixando a carga desguarnecida.",
            },
            "correta": "C",
            "analise": "ANÁLISE LOGÍSTICA: Paradas forçadas em áreas de risco exigem que a escolta estabeleça imediatamente posição de segurança defensiva acoplada, isolando o perímetro e garantindo que o motorista permaneça protegido dentro da cabine antes de qualquer tentativa de reparo mecânico.",
        },
        {
            "id": 2,
            "tema": "Seguros e Estelionato Logístico",
            "enunciado": "Durante a coleta de uma carga de alto valor, o motorista apresenta documentos falsificados perfeitos (clonados) e a carga é entregue voluntariamente a ele, que a desvia (fraude). Ao acionar a apólice de Desaparecimento de Carga (RCF-DC), a seguradora nega o sinistro. Qual a justificativa jurídica?",
            "opcoes": {
                "A": "O evento caracteriza estelionato/fraude por entrega voluntária, risco tipicamente excluído das apólices padrão de RCF-DC, que exigem violência ou roubo/furto qualificado.",
                "B": "O seguro cobre automaticamente qualquer perda por falha de cadastro, tornando o corretor financeiramente responsável pelo pagamento.",
                "C": "A apólice de RCF-DC só indeniza fraudes se a comunicação do sinistro ocorrer exatamente após 72 horas do fato ocorrido.",
                "D": "O desvio por falsificação documental transfere a responsabilidade civil unicamente para a autoridade pública emissora do documento original.",
            },
            "correta": "A",
            "analise": "ANÁLISE LOGÍSTICA: O estelionato envolve o engodo e a entrega por livre vontade da mercadoria ao criminoso. Como não há emprego de força, violência ou rompimento físico de obstáculo, esse risco é excluído da cobertura básica de RCF-DC, exigindo cláusula ou apólice específica de fraudes.",
        },
        {
            "id": 3,
            "tema": "e-POD e Validação em Áreas de Sombra",
            "enunciado": "Um aplicativo de e-POD exige conexão em tempo real para validar a geolocalização e a assinatura da entrega. Ao descarregar em uma planta industrial isolada e sem qualquer sinal de rede celular (zona de sombra), qual solução tecnológica garante a integridade legal da entrega?",
            "opcoes": {
                "A": "Utilizar o aplicativo de mensagens do celular pessoal do motorista para fotografar a nota e enviá-la dias depois, substituindo o e-POD.",
                "B": "Aguardar estacionado do lado de fora da planta por tempo indeterminado até que o sinal celular retorne de forma espontânea.",
                "C": "Homologar a entrega de forma manual retroativa no sistema do CD, sem registros de carimbo de tempo ou checagem de coordenadas geográficas.",
                "D": "Armazenar os dados localmente de forma criptografada com carimbo de tempo (offline timestamp) e hash geográfico local, enviando ao servidor assim que houver rede.",
            },
            "correta": "D",
            "analise": "ANÁLISE LOGÍSTICA: Arquiteturas modernas de e-POD aplicam o conceito de 'store-and-forward' (armazenar e encaminhar). Os dados da entrega, foto do canhoto e coordenadas são criptografados localmente no dispositivo (offline) gerando um hash seguro que impede fraudes, sendo sincronizados assim que o sinal retornar.",
        },
        {
            "id": 4,
            "tema": "Sub-rogação e Telemetria Forense em Sinistros",
            "enunciado": "Após o tombamento e saque de uma carga de alto valor na rodovia, a seguradora indeniza o embarcador e entra com ação de regresso contra a transportadora. A transportadora alega caso fortuito (defeito mecânico súbito), mas a telemetria prova que o veículo trafegava 30% acima do limite de velocidade sob chuva forte. Qual o impacto disso?",
            "opcoes": {
                "A": "O dado de telemetria é considerado sigiloso de mercado pelo juízo cível, prevalecendo o depoimento verbal do motorista.",
                "B": "A telemetria comprova a culpa por imprudência (excesso de velocidade em pista molhada), o que derruba a tese de caso fortuito e dá vitória à seguradora.",
                "C": "O excesso de velocidade isenta a transportadora, pois transfere a responsabilidade civil do acidente diretamente para o fabricante do pneu.",
                "D": "A seguradora perde o direito de regresso de forma automática se apresentar dados digitais, pois a legislação exige apenas testemunhas presenciais.",
            },
            "correta": "B",
            "analise": "ANÁLISE LOGÍSTICA: No direito securitário, os laudos de telemetria forense funcionam como prova documental eletrônica incontestável. Provar que o motorista agiu com imprudência descaracteriza o 'caso fortuito' ou 'força maior', responsabilizando civilmente o transportador pelos prejuízos gerados.",
        },
    ]

    exibir_cabecalho()
    pontuacao = 0

    for q in questoes:
        print(f"🔹 QUESTÃO {q['id']} | Tema: {q['tema']}")
        print(f"{q['enunciado']}\n")

        for letra, texto in q["opcoes"].items():
            print(f"  [{letra}] {texto}")

        print()
        resposta_usuario = ""
        while resposta_usuario not in ["A", "B", "C", "D"]:
            resposta_usuario = input("Sua resposta (A, B, C, D): ").strip().upper()

        print("\nVerificando resposta...")
        time.sleep(1)

        if resposta_usuario == q["correta"]:
            print("🟩 CORRETO! Excelente decisão operacional.")
            pontuacao += 1
        else:
            print(f"🟥 INCORRETO. A alternativa correta era a [{q['correta']}].")

        print(f"{q['analise']}\n")
        print("-" * 80)
        print()

    print("=" * 80)
    print(" 🏁  FIM DO TESTE LOGÍSTICO  🏁")
    print(
        f" Seu Placar Final: {pontuacao} de {len(questoes)} acertos "
        f"({(pontuacao / len(questoes)) * 100}%)."
    )
    print("=" * 80)


if __name__ == "__main__":
    rodar_quiz()
