use super::dimensions::Dimension;
use super::props::{UnitProps, CalcMode};
use super::units::UNIT_PROPS;

pub enum PrefixGroup {
    SI,
		Thermal, // Temperature
    Metric,
    None,
    Digital,
}

pub struct UnitDef {
		pub symbol: &'static str,
		pub dimension: Dimension,
		pub parts: Option<(&'static str, &'static str)>,
		pub numerator_group: PrefixGroup,
		pub denominator_group: PrefixGroup,
		pub scale: f64,
		pub offset: f64,
}

impl UnitDef {
    pub const fn new(
        symbol: &'static str,
        dimension: Dimension,
        parts: Option<(&'static str, &'static str)>,
        n_grp: PrefixGroup,
        d_grp: PrefixGroup,
    ) -> Self {
        Self {
            symbol,
            dimension,
            parts,
            numerator_group: n_grp,
            denominator_group: d_grp,
						scale: 1.0,
						offset: 0.0
        }
    }
		
		pub const fn new_offset(
        symbol: &'static str,
        dimension: Dimension,
        parts: Option<(&'static str, &'static str)>,
        n_grp: PrefixGroup,
        d_grp: PrefixGroup,
				scale: f64,
				offset: f64
    ) -> Self {
        Self {
            symbol,
            dimension,
            parts,
            numerator_group: n_grp,
            denominator_group: d_grp,
						scale,
						offset
        }
    }

    pub fn get_props(&self) -> &UnitProps {
        for (sym, props) in UNIT_PROPS {
            if *sym == self.symbol {
                return props;
            }
        }
        &UnitProps::DEFAULT
    }
}

impl UnitDef {
    pub fn normalize(&self, value: f64) -> f64 {
        let props = self.get_props();
        
        match props.mode {
            CalcMode::Linear => (value * props.scale) + props.offset,
            CalcMode::Exponential => {
                // K = T0 * (T1 / T0)^(G / 100)
                let t0 = props.offset;
                let t1 = props.scale;
                t0 * (t1 / t0).powf(value / 100.0)
            }
        }
    }

    pub fn denormalize(&self, base_value: f64) -> f64 {
        let props = self.get_props();

        match props.mode {
            CalcMode::Linear => (base_value - props.offset) / props.scale,
            CalcMode::Exponential => {
                // G = 100 * log_{T1/T0}(K/T0)
                let t0 = props.offset;
                let t1 = props.scale;
                100.0 * (base_value / t0).log(t1 / t0)
            }
        }
    }
}