from manim import *
import numpy as np

config.pixel_width = 1920
config.pixel_height = 1080
config.frame_width = 16.0
config.frame_height = 9.0
config.frame_rate = 60

BG = "#081328"
BRANCO = "#F5F7FA"
CINZA = "#B8C1CC"
AMARELO = "#E5C158"
CIANO = "#62C7D5"
AZUL = "#5068D8"
VERMELHO = "#FF6B6B"
LARANJA = "#FF9F43"
VERDE = "#7FFF7F"
PAINEL = "#0D1B3E"


class CompressaoConvencaoSinais(Scene):
    def construct(self):
        self.camera.background_color = BG
        np.random.seed(12)

        cyl_left = -6.0
        cyl_right = -1.8
        cyl_bottom = -3.0
        piston_initial = 2.2
        piston_final = -0.1
        cyl_width = cyl_right - cyl_left
        center_x = (cyl_left + cyl_right) / 2

        walls = VGroup(
            Line([cyl_left, cyl_bottom, 0], [cyl_left, 3.2, 0], color=CINZA, stroke_width=4),
            Line([cyl_right, cyl_bottom, 0], [cyl_right, 3.2, 0], color=CINZA, stroke_width=4),
            Line([cyl_left, cyl_bottom, 0], [cyl_right, cyl_bottom, 0], color=CINZA, stroke_width=4),
        )

        piston_y = ValueTracker(piston_initial)
        particle_speed = ValueTracker(1.0)

        gas_fill = always_redraw(lambda: Rectangle(
            width=cyl_width - 0.1,
            height=max(0.05, piston_y.get_value() - cyl_bottom - 0.15),
            fill_color=interpolate_color(
                ManimColor(CIANO),
                ManimColor(VERMELHO),
                min(1.0, max(0.0, (piston_initial - piston_y.get_value()) / (piston_initial - piston_final))),
            ),
            fill_opacity=0.14,
            stroke_width=0,
        ).move_to([center_x, (cyl_bottom + piston_y.get_value()) / 2, 0]))

        piston = always_redraw(lambda: VGroup(
            Rectangle(
                width=cyl_width,
                height=0.22,
                fill_color=AZUL,
                fill_opacity=0.95,
                stroke_color=BRANCO,
                stroke_width=2,
            ).move_to([center_x, piston_y.get_value(), 0]),
            Line(
                [center_x, piston_y.get_value() + 0.1, 0],
                [center_x, piston_y.get_value() + 0.9, 0],
                color=CINZA,
                stroke_width=4,
            ),
        ))

        particles = VGroup()
        for _ in range(34):
            dot = Dot(radius=0.055, color=CIANO)
            dot.move_to([
                np.random.uniform(cyl_left + 0.25, cyl_right - 0.25),
                np.random.uniform(cyl_bottom + 0.25, piston_initial - 0.25),
                0,
            ])
            dot.velocity = np.array([
                np.random.uniform(-1, 1),
                np.random.uniform(-1, 1),
                0.0,
            ]) * 1.4
            particles.add(dot)

        def particle_updater(mob, dt):
            top = piston_y.get_value() - 0.16
            radius = 0.055
            compression = min(1.0, max(0.0, (piston_initial - piston_y.get_value()) / (piston_initial - piston_final)))
            for dot in mob:
                dot.shift(dot.velocity * dt * particle_speed.get_value())
                x, y, _ = dot.get_center()
                if x <= cyl_left + radius + 0.05:
                    dot.velocity[0] = abs(dot.velocity[0])
                elif x >= cyl_right - radius - 0.05:
                    dot.velocity[0] = -abs(dot.velocity[0])
                if y <= cyl_bottom + radius + 0.05:
                    dot.velocity[1] = abs(dot.velocity[1])
                if y >= top - radius:
                    dot.velocity[1] = -abs(dot.velocity[1])
                    dot.set_y(min(y, top - radius - 0.01))
                dot.set_color(interpolate_color(ManimColor(CIANO), ManimColor(VERMELHO), compression))

        particles.add_updater(particle_updater)

        system_label = Text("SISTEMA: GÁS", font_size=28, color=CIANO, weight=BOLD).move_to([center_x, -2.2, 0])
        piston_label = always_redraw(lambda: Text(
            "Pistão", font_size=20, color=CINZA, weight=BOLD
        ).next_to(piston, RIGHT, buff=0.25))

        work_arrow = always_redraw(lambda: Arrow(
            [center_x, piston_y.get_value() + 2.0, 0],
            [center_x, piston_y.get_value() + 0.9, 0],
            color=LARANJA,
            stroke_width=5,
            buff=0,
            max_tip_length_to_length_ratio=0.25,
        ))
        work_label = always_redraw(lambda: MathTex(
            "W<0", font_size=44, color=LARANJA
        ).next_to(work_arrow, RIGHT, buff=0.2))

        panel_title = Text("Convenção adotada", font_size=30, color=AMARELO, weight=BOLD).move_to([4.2, 3.4, 0])
        equation = MathTex("Q", "=", r"\Delta U", "+", "W", font_size=68).move_to([4.2, 2.25, 0])
        equation[0].set_color(VERMELHO)
        equation[2].set_color(VERDE)
        equation[4].set_color(AMARELO)

        def make_box(symbol, color, description, y):
            bg = RoundedRectangle(
                width=6.2,
                height=1.05,
                corner_radius=0.15,
                fill_color=PAINEL,
                fill_opacity=0.9,
                stroke_color=color,
                stroke_width=2,
            ).move_to([4.2, y, 0])
            sym = MathTex(symbol, font_size=40, color=color).move_to(bg.get_left() + RIGHT * 0.75)
            desc = Text(description, font_size=19, color=BRANCO).move_to(bg.get_center() + RIGHT * 0.55)
            return VGroup(bg, sym, desc)

        box_positive = make_box("W>0", AMARELO, "o gás realiza trabalho", 0.55)
        box_negative = make_box("W<0", LARANJA, "trabalho realizado sobre o gás", -0.75)

        self.play(Create(walls), FadeIn(gas_fill), FadeIn(piston), run_time=1.0)
        self.play(FadeIn(particles), FadeIn(system_label), FadeIn(piston_label), run_time=0.8)
        self.wait(0.8)

        self.play(Write(panel_title), Write(equation), run_time=1.2)
        self.play(FadeIn(box_positive, shift=LEFT * 0.4), run_time=0.6)
        self.play(FadeIn(box_negative, shift=LEFT * 0.4), run_time=0.6)
        self.play(Indicate(box_negative, color=LARANJA, scale_factor=1.04), run_time=0.8)
        self.wait(0.5)

        self.play(GrowArrow(work_arrow), FadeIn(work_label), run_time=0.7)

        self.play(
            piston_y.animate.set_value(piston_final),
            particle_speed.animate.set_value(2.7),
            system_label.animate.set_opacity(0),
            run_time=4.0,
            rate_func=smooth,
        )
        self.play(
            Indicate(box_negative, color=LARANJA, scale_factor=1.04),
            run_time=0.9,
        )
        self.wait(1.8)

        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=1.0)
        self.wait(0.3)
