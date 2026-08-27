from manim import *
import numpy as np


class FirstLawAnimation(Scene):
    def construct(self):
        self.camera.background_color = "#F7F9FC"

        navy = "#0A1026"
        ink = "#10131A"
        orange = "#F28C45"
        green = "#3DBB91"
        blue = "#3D8DFF"
        teal = "#087E8B"
        muted = "#5D6470"

        title = Text(
            "Primeira Lei da Termodinâmica",
            font="Arial",
            weight=BOLD,
            color=ink,
            font_size=46,
        ).to_edge(UP, buff=0.28)
        subtitle = Text(
            "O calor recebido se distribui entre energia interna e trabalho",
            font="Arial",
            color=muted,
            font_size=25,
        ).next_to(title, DOWN, buff=0.12)

        chamber = RoundedRectangle(
            width=4.3,
            height=3.45,
            corner_radius=0.16,
            stroke_color=navy,
            stroke_width=5,
            fill_color=navy,
            fill_opacity=0.96,
        ).move_to([0, 0.25, 0])
        system_label = Text(
            "SISTEMA: GÁS",
            font="Arial",
            weight=BOLD,
            color=WHITE,
            font_size=24,
        ).move_to([0, -1.18, 0])

        piston = Rectangle(
            width=3.75,
            height=0.22,
            stroke_color="#D9DEE7",
            stroke_width=2,
            fill_color="#D9DEE7",
            fill_opacity=1,
        ).move_to([0, 0.82, 0])
        rod = Rectangle(
            width=0.18,
            height=0.68,
            stroke_width=0,
            fill_color="#AAB2BF",
            fill_opacity=1,
        ).next_to(piston, UP, buff=0)

        rng = np.random.default_rng(12)
        colors = ["#22D3EE", "#67E8F9", "#5EEAD4"]
        particles = VGroup()
        for i in range(18):
            x = rng.uniform(-1.65, 1.65)
            y = rng.uniform(-0.78, 0.55)
            particles.add(
                Dot(
                    point=[x, y + 0.25, 0],
                    radius=0.075,
                    color=colors[i % len(colors)],
                )
            )

        heat_arrow = Arrow(
            start=[-6.1, 0.25, 0],
            end=[-2.35, 0.25, 0],
            buff=0,
            stroke_width=10,
            color=orange,
            max_tip_length_to_length_ratio=0.12,
        )
        heat_label = Text(
            "CALOR  Q",
            font="Arial",
            weight=BOLD,
            color=orange,
            font_size=32,
        ).next_to(heat_arrow, UP, buff=0.2)

        work_arrow = Arrow(
            start=[2.35, 0.25, 0],
            end=[6.05, 0.25, 0],
            buff=0,
            stroke_width=10,
            color=blue,
            max_tip_length_to_length_ratio=0.12,
        )
        work_label = Text(
            "TRABALHO  W",
            font="Arial",
            weight=BOLD,
            color=blue,
            font_size=30,
        ).next_to(work_arrow, UP, buff=0.2)

        internal_label = Text(
            "ΔU: partículas mais rápidas",
            font="Arial",
            weight=BOLD,
            color=green,
            font_size=27,
        ).move_to([0, -1.82, 0])
        expansion_label = Text(
            "W: o pistão sobe",
            font="Arial",
            weight=BOLD,
            color=blue,
            font_size=25,
        ).move_to([4.15, -0.55, 0])

        q = Text("Q", font="Arial", weight=BOLD, color=orange, font_size=54)
        equals = Text("=", font="Arial", weight=BOLD, color=navy, font_size=54)
        du = Text("ΔU", font="Arial", weight=BOLD, color=green, font_size=54)
        plus = Text("+", font="Arial", weight=BOLD, color=navy, font_size=54)
        w = Text("W", font="Arial", weight=BOLD, color=blue, font_size=54)
        equation = VGroup(q, equals, du, plus, w).arrange(RIGHT, buff=0.23).to_edge(DOWN, buff=0.34)

        self.play(FadeIn(title, shift=DOWN * 0.2), FadeIn(subtitle), run_time=1.2)
        self.play(
            FadeIn(chamber),
            FadeIn(piston),
            FadeIn(rod),
            FadeIn(particles),
            FadeIn(system_label),
            Write(equation),
            run_time=1.5,
        )
        self.wait(0.5)

        self.play(GrowArrow(heat_arrow), FadeIn(heat_label, shift=UP * 0.15), Indicate(q), run_time=1.4)

        pulses = VGroup(*[
            Dot([-5.7 - 0.35 * i, 0.25, 0], radius=0.11, color=orange)
            for i in range(4)
        ])
        self.add(pulses)
        self.play(
            LaggedStart(*[
                MoveAlongPath(pulse, Line(pulse.get_center(), [-0.9 + 0.55 * i, 0.25, 0]))
                for i, pulse in enumerate(pulses)
            ], lag_ratio=0.14),
            run_time=1.6,
        )
        self.play(FadeOut(pulses), run_time=0.3)

        motions = []
        for i, dot in enumerate(particles):
            dx = 0.18 if i % 2 == 0 else -0.18
            dy = 0.12 if i % 3 == 0 else -0.10
            motions.append(dot.animate.shift([dx, dy, 0]).scale(1.18).set_color(YELLOW))
        self.play(
            LaggedStart(*motions, lag_ratio=0.025),
            FadeIn(internal_label, shift=UP * 0.15),
            Indicate(du),
            run_time=1.8,
        )
        self.play(
            LaggedStart(*[
                dot.animate.shift([
                    -0.28 if i % 2 == 0 else 0.28,
                    0.16 if i % 3 == 1 else -0.12,
                    0,
                ])
                for i, dot in enumerate(particles)
            ], lag_ratio=0.02),
            run_time=1.0,
        )

        self.play(
            piston.animate.shift(UP * 0.62),
            rod.animate.shift(UP * 0.62),
            GrowArrow(work_arrow),
            FadeIn(work_label, shift=UP * 0.15),
            FadeIn(expansion_label, shift=LEFT * 0.15),
            Indicate(w),
            run_time=1.8,
        )

        split_caption = Text(
            "A energia recebida não desaparece: ela muda de forma.",
            font="Arial",
            weight=BOLD,
            color=teal,
            font_size=27,
        ).move_to([0, -2.35, 0])
        self.play(Write(split_caption), Circumscribe(equation, color=teal, buff=0.16), run_time=1.5)

        example = Text(
            "Exemplo: 100 J = 60 J + 40 J",
            font="Arial",
            weight=BOLD,
            color=navy,
            font_size=31,
        ).move_to([0, -2.78, 0])
        self.play(FadeIn(example, shift=UP * 0.15), run_time=1.0)
        self.wait(2.2)
