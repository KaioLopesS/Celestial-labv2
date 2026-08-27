from manim import *
import numpy as np

# ═══════════════════════════════════════════════════════════════════
#  1ª LEI DA TERMODINÂMICA — 16:9 (Widescreen) — SEM LOGO / SEM TÍTULO
#  Resolução: 1920×1080 | 60 fps
# ═══════════════════════════════════════════════════════════════════

config.pixel_width = 1920
config.pixel_height = 1080
config.frame_width = 16.0
config.frame_height = 9.0
config.frame_rate = 60

# ─── PALETA ───
BG         = "#081328"
BRANCO     = "#F5F7FA"
CINZA      = "#B8C1CC"
AMARELO    = "#E5C158"
CIANO      = "#62C7D5"
AZUL       = "#5068D8"
VERMELHO   = "#FF6B6B"
LARANJA    = "#FF9F43"
VERDE      = "#7FFF7F"
PAINEL     = "#0D1B3E"
ROXO       = "#B97AFF"


class PrimeiraLeiTermodinamica(Scene):
    def construct(self):
        self.camera.background_color = BG

        # ══════════════════════════════════════════════════════════
        #  GEOMETRIA DO CILINDRO-PISTÃO  (lado esquerdo da tela)
        # ══════════════════════════════════════════════════════════
        CYL_LEFT   = -6.0
        CYL_RIGHT  = -1.5
        CYL_BOT    = -3.0
        CYL_WIDTH  = CYL_RIGHT - CYL_LEFT
        PISTON_Y0  = 1.0      # posição inicial do pistão
        PISTON_YF  = 3.0      # posição final (expandido)

        # Paredes do cilindro
        wall_left  = Line([CYL_LEFT, CYL_BOT, 0], [CYL_LEFT, PISTON_YF + 1.0, 0],
                          color=CINZA, stroke_width=4)
        wall_right = Line([CYL_RIGHT, CYL_BOT, 0], [CYL_RIGHT, PISTON_YF + 1.0, 0],
                          color=CINZA, stroke_width=4)
        wall_bot   = Line([CYL_LEFT, CYL_BOT, 0], [CYL_RIGHT, CYL_BOT, 0],
                          color=CINZA, stroke_width=4)
        cilindro   = VGroup(wall_left, wall_right, wall_bot)

        # Tracker do pistão
        piston_y = ValueTracker(PISTON_Y0)

        # Pistão (barra horizontal)
        piston_bar = always_redraw(lambda: VGroup(
            Rectangle(
                width=CYL_WIDTH, height=0.2,
                fill_color=AZUL, fill_opacity=0.9,
                stroke_color=WHITE, stroke_width=2
            ).move_to([
                (CYL_LEFT + CYL_RIGHT) / 2,
                piston_y.get_value(), 0
            ]),
            # Haste
            Line(
                [(CYL_LEFT + CYL_RIGHT) / 2, piston_y.get_value() + 0.1, 0],
                [(CYL_LEFT + CYL_RIGHT) / 2, piston_y.get_value() + 0.8, 0],
                color=CINZA, stroke_width=4
            ),
            # Seta W para cima no topo da haste
        ))

        # Label "Pistão"
        piston_label = always_redraw(lambda:
            Text("Pistão", font_size=20, color=CINZA, weight=BOLD)
            .next_to(piston_bar, RIGHT, buff=0.3)
        )

        # ── Preenchimento de cor do gás (região abaixo do pistão) ──
        gas_fill = always_redraw(lambda: Rectangle(
            width=CYL_WIDTH - 0.1,
            height=piston_y.get_value() - CYL_BOT - 0.15,
            fill_color=interpolate_color(
                ManimColor(CIANO), ManimColor(VERMELHO),
                min(1.0, max(0.0, (piston_y.get_value() - PISTON_Y0) / (PISTON_YF - PISTON_Y0)))
            ),
            fill_opacity=0.12,
            stroke_width=0
        ).move_to([
            (CYL_LEFT + CYL_RIGHT) / 2,
            (CYL_BOT + piston_y.get_value()) / 2, 0
        ]))

        # ── Partículas do gás ──
        NUM_PARTICLES = 35
        particles = VGroup()
        for _ in range(NUM_PARTICLES):
            dot = Dot(radius=0.06, color=CIANO)
            dot.move_to([
                np.random.uniform(CYL_LEFT + 0.3, CYL_RIGHT - 0.3),
                np.random.uniform(CYL_BOT + 0.3, PISTON_Y0 - 0.3),
                0
            ])
            dot.velocity = np.array([
                np.random.uniform(-1, 1),
                np.random.uniform(-1, 1),
                0.0
            ]) * 1.5
            particles.add(dot)

        temp_factor = ValueTracker(1.0)  # multiplicador de velocidade

        def gas_updater(mob, dt):
            yt = piston_y.get_value() - 0.15
            speed = temp_factor.get_value()
            r = 0.06
            ratio = min(1.0, max(0.0, (piston_y.get_value() - PISTON_Y0) / (PISTON_YF - PISTON_Y0)))
            for dot in mob:
                dot.shift(dot.velocity * dt * speed)
                x, y, _ = dot.get_center()
                if x <= CYL_LEFT + r + 0.05:
                    dot.velocity[0] = abs(dot.velocity[0])
                elif x >= CYL_RIGHT - r - 0.05:
                    dot.velocity[0] = -abs(dot.velocity[0])
                if y <= CYL_BOT + r + 0.05:
                    dot.velocity[1] = abs(dot.velocity[1])
                if y >= yt - r:
                    dot.velocity[1] = -abs(dot.velocity[1])
                    if y > yt:
                        dot.set_y(yt - r - 0.01)
                # Cor muda com a temperatura
                dot.set_color(interpolate_color(
                    ManimColor(CIANO), ManimColor(VERMELHO), ratio
                ))

        particles.add_updater(gas_updater)

        # Label "Gás"
        gas_label = Text("Gás", font_size=28, color=CIANO, weight=BOLD).move_to(
            [(CYL_LEFT + CYL_RIGHT) / 2, (CYL_BOT + PISTON_Y0) / 2, 0]
        )

        # ══════════════════════════════════════════════════════════
        #  SETAS DE CALOR Q (por baixo)
        # ══════════════════════════════════════════════════════════
        flame_arrows = VGroup()
        for x_pos in np.linspace(CYL_LEFT + 0.8, CYL_RIGHT - 0.8, 5):
            arr = Arrow(
                [x_pos, CYL_BOT - 1.2, 0],
                [x_pos, CYL_BOT - 0.1, 0],
                color=VERMELHO, stroke_width=4, buff=0,
                max_tip_length_to_length_ratio=0.3
            )
            flame_arrows.add(arr)

        q_label = MathTex("Q", font_size=52, color=VERMELHO).next_to(
            flame_arrows, LEFT, buff=0.4
        )

        # ── Chamas decorativas (triângulos pulsantes) ──
        flames = VGroup()
        for x_pos in np.linspace(CYL_LEFT + 0.5, CYL_RIGHT - 0.5, 7):
            h = np.random.uniform(0.3, 0.55)
            flame = Polygon(
                [x_pos - 0.15, CYL_BOT, 0],
                [x_pos + 0.15, CYL_BOT, 0],
                [x_pos, CYL_BOT - h, 0],
                fill_color=LARANJA, fill_opacity=0.7,
                stroke_width=0
            )
            flames.add(flame)

        # ══════════════════════════════════════════════════════════
        #  SETA W (trabalho — para cima, ao lado do pistão)
        # ══════════════════════════════════════════════════════════
        w_arrow = always_redraw(lambda: Arrow(
            [(CYL_LEFT + CYL_RIGHT) / 2, piston_y.get_value() + 0.9, 0],
            [(CYL_LEFT + CYL_RIGHT) / 2, piston_y.get_value() + 2.0, 0],
            color=AMARELO, stroke_width=5, buff=0,
            max_tip_length_to_length_ratio=0.25
        ))
        w_label = always_redraw(lambda: MathTex(
            "W", font_size=44, color=AMARELO
        ).next_to(w_arrow, RIGHT, buff=0.2))

        # ══════════════════════════════════════════════════════════
        #  PAINEL DIDÁTICO  (lado direito da tela)
        # ══════════════════════════════════════════════════════════
        # Equação principal
        eq_title = Text("1ª Lei da Termodinâmica", font_size=30,
                        color=AMARELO, weight=BOLD).move_to([4.5, 3.5, 0])

        # Q = ΔU + W
        eq_main = MathTex(
            "Q", "=", r"\Delta U", "+", "W",
            font_size=64
        ).move_to([4.5, 2.3, 0])
        eq_main[0].set_color(VERMELHO)  # Q
        eq_main[2].set_color(VERDE)     # ΔU
        eq_main[4].set_color(AMARELO)   # W

        # Caixas explicativas
        def make_box(icon_tex, icon_color, desc_text, y_pos):
            bg = RoundedRectangle(
                width=6.5, height=1.2, corner_radius=0.15,
                fill_color=PAINEL, fill_opacity=0.85,
                stroke_color=icon_color, stroke_width=2
            ).move_to([4.5, y_pos, 0])
            icon = MathTex(icon_tex, font_size=40, color=icon_color).move_to(
                bg.get_left() + RIGHT * 0.7
            )
            desc = Text(desc_text, font_size=20, color=BRANCO,
                        line_spacing=1.2).move_to(
                bg.get_center() + RIGHT * 0.5
            )
            return VGroup(bg, icon, desc)

        box_q = make_box("Q", VERMELHO,
                         "Calor fornecido ao sistema", 0.6)
        box_w = make_box("W", AMARELO,
                         "Trabalho realizado pelo gás", -0.8)
        box_u = make_box(r"\Delta U", VERDE,
                         "Variação de energia interna", -2.2)

        # Barra de energia interna animada
        bar_bg = RoundedRectangle(
            width=5.5, height=0.5, corner_radius=0.1,
            fill_color="#1a2744", fill_opacity=1.0,
            stroke_color=CINZA, stroke_width=1
        ).move_to([4.5, -3.3, 0])

        energy_ratio = ValueTracker(0.0)
        bar_fill = always_redraw(lambda: RoundedRectangle(
            width=max(0.01, 5.5 * energy_ratio.get_value()),
            height=0.44, corner_radius=0.08,
            fill_color=interpolate_color(ManimColor(CIANO), ManimColor(VERDE),
                                         energy_ratio.get_value()),
            fill_opacity=0.9, stroke_width=0
        ).align_to(bar_bg, LEFT).shift(RIGHT * 0.03))

        bar_label = Text("Energia Interna (U)", font_size=18,
                         color=VERDE, weight=BOLD).next_to(bar_bg, UP, buff=0.15)

        bar_pct = always_redraw(lambda: Text(
            f"{int(energy_ratio.get_value() * 100)}%",
            font_size=20, color=BRANCO, weight=BOLD
        ).move_to(bar_bg.get_center()))

        # ══════════════════════════════════════════════════════════
        #   ANIMAÇÃO
        # ══════════════════════════════════════════════════════════

        # ── Fase 1: Montar o cilindro ──
        self.play(
            Create(cilindro),
            FadeIn(gas_fill),
            FadeIn(piston_bar),
            run_time=1.0
        )
        self.play(
            FadeIn(particles),
            FadeIn(gas_label),
            FadeIn(piston_label),
            run_time=0.8
        )
        self.wait(0.5)

        # ── Fase 2: Mostrar o calor chegando ──
        self.play(
            FadeIn(flames, shift=UP * 0.2),
            run_time=0.5
        )
        self.play(
            *[GrowArrow(a) for a in flame_arrows],
            FadeIn(q_label, shift=RIGHT * 0.3),
            run_time=1.0
        )

        # Pulso nas chamas
        self.play(
            flames.animate.shift(DOWN * 0.08).set_opacity(1.0),
            rate_func=there_and_back,
            run_time=0.5
        )
        self.wait(0.3)

        # ── Fase 3: Mostrar equação ──
        self.play(Write(eq_title), run_time=0.8)
        self.play(Write(eq_main), run_time=1.2)
        self.play(
            Circumscribe(eq_main, color=AMARELO, buff=0.2, run_time=1.2)
        )
        self.wait(0.5)

        # ── Fase 4: Caixas explicativas uma a uma ──
        self.play(FadeIn(box_q, shift=LEFT * 0.5), run_time=0.6)
        self.play(
            Indicate(eq_main[0], color=VERMELHO, scale_factor=1.3),
            run_time=0.5
        )
        self.wait(0.3)

        self.play(FadeIn(box_u, shift=LEFT * 0.5), run_time=0.6)
        self.play(
            Indicate(eq_main[2], color=VERDE, scale_factor=1.3),
            run_time=0.5
        )
        self.wait(0.3)

        self.play(FadeIn(box_w, shift=LEFT * 0.5), run_time=0.6)
        self.play(
            Indicate(eq_main[4], color=AMARELO, scale_factor=1.3),
            run_time=0.5
        )
        self.wait(0.3)

        # ── Fase 5: Barra de energia ──
        self.wait(0.3)

        # ── Fase 6: PROCESSO — Calor entra, pistão sobe, ΔU aumenta ──

        # Seta W aparece
        self.play(GrowArrow(w_arrow), FadeIn(w_label), run_time=0.6)

        # ── A grande animação: tudo acontece junto ──
        # Partículas aceleram, pistão sobe, barra enche
        self.play(
            piston_y.animate.set_value(PISTON_YF),
            temp_factor.animate.set_value(2.5),
            energy_ratio.animate.set_value(0.65),
            gas_label.animate.set_opacity(0),
            run_time=3.5,
            rate_func=smooth
        )
        self.wait(1.0)

        # Pulso na chama (calor continua)
        self.play(
            flames.animate.shift(DOWN * 0.1).set_opacity(1.0),
            flame_arrows.animate.set_color(LARANJA),
            rate_func=there_and_back, run_time=0.5
        )
        self.play(
            flame_arrows.animate.set_color(VERMELHO),
            run_time=0.3
        )

        # ── Fase 7: Destaque final na equação ──
        eq_box = SurroundingRectangle(
            eq_main, color=AMARELO, buff=0.25,
            corner_radius=0.1, stroke_width=3
        )

        final_txt = MathTex(
            "Q", "=", r"\Delta U", "+", "W",
            font_size=64
        ).move_to([4.5, 2.3, 0])
        final_txt[0].set_color(VERMELHO)
        final_txt[2].set_color(VERDE)
        final_txt[4].set_color(AMARELO)

        self.play(
            Transform(eq_main, final_txt),
            Create(eq_box),
            Flash(eq_main, color=AMARELO, line_length=0.4, num_lines=16),
            run_time=1.2
        )

        self.wait(2.0)

        # ── Fade out geral ──
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=1.0
        )
        self.wait(0.5)


# ═══════════════════════════════════════════════════════════════════
#  CONVENÇÃO DE SINAIS DO TRABALHO — COMPRESSÃO
#  manim -pql primeira_lei_termodinamica_16x9.py ConvencaoSinaisTrabalho
# ═══════════════════════════════════════════════════════════════════

class ConvencaoSinaisTrabalho(Scene):
    def construct(self):
        self.camera.background_color = BG

        # ══════════════════════════════════════════════════════════
        #  DOIS CILINDROS LADO A LADO
        #  Esquerdo: EXPANSÃO (W > 0)   |   Direito: COMPRESSÃO (W < 0)
        # ══════════════════════════════════════════════════════════

        # ─── Geometria compartilhada ───
        CYL_W     = 3.2
        CYL_BOT   = -2.5
        CYL_TOP_W = 3.8       # altura das paredes

        # ── Cilindro ESQUERDO (Expansão) ──
        EXP_CX    = -4.5      # centro x
        EXP_L     = EXP_CX - CYL_W / 2
        EXP_R     = EXP_CX + CYL_W / 2
        EXP_Y0    = 0.0       # pistão começa baixo
        EXP_YF    = 2.0       # pistão sobe

        exp_walls = VGroup(
            Line([EXP_L, CYL_BOT, 0], [EXP_L, CYL_TOP_W, 0], color=CINZA, stroke_width=4),
            Line([EXP_R, CYL_BOT, 0], [EXP_R, CYL_TOP_W, 0], color=CINZA, stroke_width=4),
            Line([EXP_L, CYL_BOT, 0], [EXP_R, CYL_BOT, 0], color=CINZA, stroke_width=4),
        )

        exp_piston_y = ValueTracker(EXP_Y0)

        exp_piston = always_redraw(lambda: Rectangle(
            width=CYL_W, height=0.2,
            fill_color=AZUL, fill_opacity=0.9,
            stroke_color=WHITE, stroke_width=2
        ).move_to([EXP_CX, exp_piston_y.get_value(), 0]))

        exp_haste = always_redraw(lambda: Line(
            [EXP_CX, exp_piston_y.get_value() + 0.1, 0],
            [EXP_CX, exp_piston_y.get_value() + 0.7, 0],
            color=CINZA, stroke_width=4
        ))

        exp_fill = always_redraw(lambda: Rectangle(
            width=CYL_W - 0.1,
            height=exp_piston_y.get_value() - CYL_BOT - 0.15,
            fill_color=CIANO, fill_opacity=0.10,
            stroke_width=0
        ).move_to([EXP_CX, (CYL_BOT + exp_piston_y.get_value()) / 2, 0]))

        # Partículas expansão
        exp_particles = VGroup()
        for _ in range(25):
            dot = Dot(radius=0.05, color=CIANO)
            dot.move_to([
                np.random.uniform(EXP_L + 0.2, EXP_R - 0.2),
                np.random.uniform(CYL_BOT + 0.2, EXP_Y0 - 0.2),
                0
            ])
            dot.velocity = np.array([
                np.random.uniform(-1, 1),
                np.random.uniform(-1, 1), 0.0
            ]) * 1.5
            exp_particles.add(dot)

        exp_speed = ValueTracker(1.0)

        def exp_updater(mob, dt):
            yt = exp_piston_y.get_value() - 0.15
            spd = exp_speed.get_value()
            r = 0.05
            for dot in mob:
                dot.shift(dot.velocity * dt * spd)
                x, y, _ = dot.get_center()
                if x <= EXP_L + r + 0.05:
                    dot.velocity[0] = abs(dot.velocity[0])
                elif x >= EXP_R - r - 0.05:
                    dot.velocity[0] = -abs(dot.velocity[0])
                if y <= CYL_BOT + r + 0.05:
                    dot.velocity[1] = abs(dot.velocity[1])
                if y >= yt - r:
                    dot.velocity[1] = -abs(dot.velocity[1])
                    if y > yt:
                        dot.set_y(yt - r - 0.01)

        exp_particles.add_updater(exp_updater)

        # ── Cilindro DIREITO (Compressão) ──
        CMP_CX    = 4.5
        CMP_L     = CMP_CX - CYL_W / 2
        CMP_R     = CMP_CX + CYL_W / 2
        CMP_Y0    = 2.0       # pistão começa alto
        CMP_YF    = 0.0       # pistão desce (comprime)

        cmp_walls = VGroup(
            Line([CMP_L, CYL_BOT, 0], [CMP_L, CYL_TOP_W, 0], color=CINZA, stroke_width=4),
            Line([CMP_R, CYL_BOT, 0], [CMP_R, CYL_TOP_W, 0], color=CINZA, stroke_width=4),
            Line([CMP_L, CYL_BOT, 0], [CMP_R, CYL_BOT, 0], color=CINZA, stroke_width=4),
        )

        cmp_piston_y = ValueTracker(CMP_Y0)

        cmp_piston = always_redraw(lambda: Rectangle(
            width=CYL_W, height=0.2,
            fill_color=VERMELHO, fill_opacity=0.9,
            stroke_color=WHITE, stroke_width=2
        ).move_to([CMP_CX, cmp_piston_y.get_value(), 0]))

        cmp_haste = always_redraw(lambda: Line(
            [CMP_CX, cmp_piston_y.get_value() + 0.1, 0],
            [CMP_CX, cmp_piston_y.get_value() + 0.7, 0],
            color=CINZA, stroke_width=4
        ))

        cmp_fill = always_redraw(lambda: Rectangle(
            width=CYL_W - 0.1,
            height=max(0.05, cmp_piston_y.get_value() - CYL_BOT - 0.15),
            fill_color=VERMELHO, fill_opacity=0.10,
            stroke_width=0
        ).move_to([CMP_CX, (CYL_BOT + cmp_piston_y.get_value()) / 2, 0]))

        # Partículas compressão
        cmp_particles = VGroup()
        for _ in range(25):
            dot = Dot(radius=0.05, color=CIANO)
            dot.move_to([
                np.random.uniform(CMP_L + 0.2, CMP_R - 0.2),
                np.random.uniform(CYL_BOT + 0.2, CMP_Y0 - 0.2),
                0
            ])
            dot.velocity = np.array([
                np.random.uniform(-1, 1),
                np.random.uniform(-1, 1), 0.0
            ]) * 1.5
            cmp_particles.add(dot)

        cmp_speed = ValueTracker(1.0)

        def cmp_updater(mob, dt):
            yt = cmp_piston_y.get_value() - 0.15
            spd = cmp_speed.get_value()
            r = 0.05
            ratio = min(1.0, max(0.0, (CMP_Y0 - cmp_piston_y.get_value()) / (CMP_Y0 - CMP_YF)))
            for dot in mob:
                dot.shift(dot.velocity * dt * spd)
                x, y, _ = dot.get_center()
                if x <= CMP_L + r + 0.05:
                    dot.velocity[0] = abs(dot.velocity[0])
                elif x >= CMP_R - r - 0.05:
                    dot.velocity[0] = -abs(dot.velocity[0])
                if y <= CYL_BOT + r + 0.05:
                    dot.velocity[1] = abs(dot.velocity[1])
                if y >= yt - r:
                    dot.velocity[1] = -abs(dot.velocity[1])
                    if y > yt:
                        dot.set_y(yt - r - 0.01)
                dot.set_color(interpolate_color(
                    ManimColor(CIANO), ManimColor(VERMELHO), ratio
                ))

        cmp_particles.add_updater(cmp_updater)

        # ══════════════════════════════════════════════════════════
        #  LABELS E SETAS
        # ══════════════════════════════════════════════════════════

        # Títulos acima de cada cilindro
        exp_title = Text("EXPANSÃO", font_size=32, color=CIANO, weight=BOLD).move_to(
            [EXP_CX, CYL_TOP_W + 0.4, 0]
        )
        cmp_title = Text("COMPRESSÃO", font_size=32, color=VERMELHO, weight=BOLD).move_to(
            [CMP_CX, CYL_TOP_W + 0.4, 0]
        )

        # Seta W pra cima (expansão) — aparece depois
        exp_w_arrow = always_redraw(lambda: Arrow(
            [EXP_CX, exp_piston_y.get_value() + 0.8, 0],
            [EXP_CX, exp_piston_y.get_value() + 1.8, 0],
            color=AMARELO, stroke_width=5, buff=0,
            max_tip_length_to_length_ratio=0.25
        ))
        exp_w_label = always_redraw(lambda: MathTex(
            "W", font_size=40, color=AMARELO
        ).next_to(exp_w_arrow, RIGHT, buff=0.15))

        # Seta W pra baixo (compressão) — aparece depois
        cmp_w_arrow = always_redraw(lambda: Arrow(
            [CMP_CX, cmp_piston_y.get_value() + 1.8, 0],
            [CMP_CX, cmp_piston_y.get_value() + 0.8, 0],
            color=LARANJA, stroke_width=5, buff=0,
            max_tip_length_to_length_ratio=0.25
        ))
        cmp_w_label = always_redraw(lambda: MathTex(
            "W", font_size=40, color=LARANJA
        ).next_to(cmp_w_arrow, RIGHT, buff=0.15))

        # Linha divisória central
        div_line = DashedLine(
            [0, -3.5, 0], [0, 4.5, 0],
            color=CINZA, stroke_width=1.5, dash_length=0.15
        )

        # ══════════════════════════════════════════════════════════
        #   ANIMAÇÃO
        # ══════════════════════════════════════════════════════════

        # ── Fase 1: Montar ambos os cilindros ──
        self.play(
            Create(exp_walls), Create(cmp_walls),
            FadeIn(div_line),
            run_time=0.8
        )
        self.play(
            FadeIn(exp_fill), FadeIn(cmp_fill),
            FadeIn(exp_piston), FadeIn(cmp_piston),
            FadeIn(exp_haste), FadeIn(cmp_haste),
            FadeIn(exp_particles), FadeIn(cmp_particles),
            run_time=0.8
        )
        self.play(
            Write(exp_title), Write(cmp_title),
            run_time=0.8
        )
        self.wait(0.5)

        # ── Fase 2: Mostrar setas W ──
        self.play(
            GrowArrow(exp_w_arrow), FadeIn(exp_w_label),
            GrowArrow(cmp_w_arrow), FadeIn(cmp_w_label),
            run_time=0.8
        )
        self.wait(0.5)

        # ── Fase 3: Animação simultânea — expansão e compressão ──
        self.play(
            exp_piston_y.animate.set_value(EXP_YF),
            exp_speed.animate.set_value(1.8),
            cmp_piston_y.animate.set_value(CMP_YF),
            cmp_speed.animate.set_value(2.8),
            run_time=3.5,
            rate_func=smooth
        )
        self.wait(0.5)

        # ── Fase 4: Convenção de sinais ──

        # Painel esquerdo: W > 0
        sign_exp_bg = RoundedRectangle(
            width=3.5, height=1.4, corner_radius=0.15,
            fill_color=PAINEL, fill_opacity=0.9,
            stroke_color=CIANO, stroke_width=2
        ).move_to([EXP_CX, CYL_BOT - 1.0, 0])

        sign_exp_eq = MathTex(
            "W", ">", "0", font_size=48
        ).move_to(sign_exp_bg.get_center() + UP * 0.2)
        sign_exp_eq[0].set_color(AMARELO)
        sign_exp_eq[2].set_color(CIANO)

        sign_exp_desc = Text(
            "Gás realiza trabalho", font_size=18, color=BRANCO
        ).move_to(sign_exp_bg.get_center() + DOWN * 0.35)

        sign_exp = VGroup(sign_exp_bg, sign_exp_eq, sign_exp_desc)

        # Painel direito: W < 0
        sign_cmp_bg = RoundedRectangle(
            width=3.5, height=1.4, corner_radius=0.15,
            fill_color=PAINEL, fill_opacity=0.9,
            stroke_color=VERMELHO, stroke_width=2
        ).move_to([CMP_CX, CYL_BOT - 1.0, 0])

        sign_cmp_eq = MathTex(
            "W", "<", "0", font_size=48
        ).move_to(sign_cmp_bg.get_center() + UP * 0.2)
        sign_cmp_eq[0].set_color(LARANJA)
        sign_cmp_eq[2].set_color(VERMELHO)

        sign_cmp_desc = Text(
            "Trabalho sobre o gás", font_size=18, color=BRANCO
        ).move_to(sign_cmp_bg.get_center() + DOWN * 0.35)

        sign_cmp = VGroup(sign_cmp_bg, sign_cmp_eq, sign_cmp_desc)

        self.play(
            FadeIn(sign_exp, shift=UP * 0.3),
            run_time=0.8
        )
        self.play(
            Flash(sign_exp_eq, color=CIANO, line_length=0.3, num_lines=10),
            run_time=0.6
        )
        self.wait(0.3)

        self.play(
            FadeIn(sign_cmp, shift=UP * 0.3),
            run_time=0.8
        )
        self.play(
            Flash(sign_cmp_eq, color=VERMELHO, line_length=0.3, num_lines=10),
            run_time=0.6
        )
        self.wait(0.5)

        # ── Fase 5: Volume ──
        vol_exp = MathTex(
            r"\Delta V > 0", font_size=34, color=CIANO
        ).next_to(sign_exp_bg, DOWN, buff=0.3)
        vol_cmp = MathTex(
            r"\Delta V < 0", font_size=34, color=VERMELHO
        ).next_to(sign_cmp_bg, DOWN, buff=0.3)

        self.play(
            FadeIn(vol_exp, shift=UP * 0.2),
            FadeIn(vol_cmp, shift=UP * 0.2),
            run_time=0.6
        )
        self.wait(0.5)

        # ── Fase 6: Equação central W = P ΔV ──
        eq_central = MathTex(
            "W", "=", "P", r"\cdot", r"\Delta V",
            font_size=56
        ).move_to([0, CYL_BOT - 1.0, 0])
        eq_central[0].set_color(AMARELO)
        eq_central[2].set_color(BRANCO)
        eq_central[4].set_color(VERDE)

        eq_box = SurroundingRectangle(
            eq_central, color=AMARELO, buff=0.25,
            corner_radius=0.1, stroke_width=2
        )

        self.play(
            Write(eq_central),
            run_time=1.0
        )
        self.play(
            Create(eq_box),
            Flash(eq_central, color=AMARELO, line_length=0.3, num_lines=12),
            run_time=1.0
        )

        self.wait(2.5)

        # ── Fade out geral ──
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=1.0
        )
        self.wait(0.5)
