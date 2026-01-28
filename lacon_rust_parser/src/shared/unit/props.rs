pub enum CalcMode {
    Linear,
    Exponential,
}

pub struct UnitProps {
    pub scale: f64,
    pub offset: f64,
    pub mode: CalcMode,
}

impl UnitProps {
    pub const DEFAULT: Self = Self {
        scale: 1.0,
        offset: 0.0,
				mode: CalcMode::Linear,
    };
}
