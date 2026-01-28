use super::dimensions::Dimension;
use super::definition::{PrefixGroup, UnitDef};
use super::props::{UnitProps, CalcMode};

pub static UNITS: &[UnitDef] = &[
    UnitDef::new("Hz",       Dimension::Frequency,       None,               PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("g",        Dimension::Mass,            None,               PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("m",        Dimension::Length,          None,               PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("s",        Dimension::Time,            None,               PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("mol",      Dimension::Amount,          None,               PrefixGroup::SI, PrefixGroup::SI),
		//
    UnitDef::new("g/m2",     Dimension::AreaDensity,     Some(("g", "m2")),  PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("g/m3",     Dimension::Density,         Some(("g", "m3")),  PrefixGroup::SI, PrefixGroup::SI),
		//
    UnitDef::new("m/s",      Dimension::Velocity,        Some(("m", "s")),   PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("m/s2",     Dimension::Acceleration,    Some(("m", "s2")),  PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("m/s3",     Dimension::Jerk,            Some(("m", "s3")),  PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("m/s4",     Dimension::Snap,            Some(("m", "s4")),  PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("m/s5",     Dimension::Crackle,         Some(("m", "s5")),  PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("m/s6",     Dimension::Pop,             Some(("m", "s6")),  PrefixGroup::SI, PrefixGroup::SI),
		//
    UnitDef::new("b",        Dimension::Size,            None,               PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("B",        Dimension::Size,            None,               PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("bit/s",    Dimension::BitRate,         Some(("bit", "s")), PrefixGroup::SI, PrefixGroup::SI),
    UnitDef::new("B/s",      Dimension::BitRate,         Some(("B", "s")),   PrefixGroup::SI, PrefixGroup::SI),
		//
    UnitDef::new("t",        Dimension::Mass,            None,               PrefixGroup::None, PrefixGroup::None),
		//
    UnitDef::new("ft",       Dimension::Length,          None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("mi",       Dimension::Length,          None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("in",       Dimension::Length,          None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("em",       Dimension::Length,          None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("rem",      Dimension::Length,          None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("pt",       Dimension::Length,          None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("pc",       Dimension::Length,          None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("px",       Dimension::Length,          None,               PrefixGroup::None, PrefixGroup::None),
		//
    UnitDef::new("min",      Dimension::Time,            None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("hour",     Dimension::Time,            None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("day",      Dimension::Time,            None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("week",     Dimension::Time,            None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("month",    Dimension::Time,            None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("year",     Dimension::Time,            None,               PrefixGroup::None, PrefixGroup::None),
		//
    UnitDef::new("ft/s",     Dimension::Velocity,        Some(("m", "s")),   PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("mi/h",     Dimension::Velocity,        Some(("m", "s")),   PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("kn",       Dimension::Velocity,        Some(("m", "s")),   PrefixGroup::None, PrefixGroup::None),
		//
    UnitDef::new("K",        Dimension::Temperature,     None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("C",        Dimension::Temperature,     None,               PrefixGroup::Thermal, PrefixGroup::Thermal),
		UnitDef::new("F",        Dimension::Temperature,     None,               PrefixGroup::Thermal, PrefixGroup::Thermal),
		UnitDef::new("Ra",       Dimension::Temperature,     None,               PrefixGroup::Thermal, PrefixGroup::Thermal),
		UnitDef::new("N",        Dimension::Temperature,     None,               PrefixGroup::Thermal, PrefixGroup::Thermal),
		UnitDef::new("D",        Dimension::Temperature,     None,               PrefixGroup::Thermal, PrefixGroup::Thermal),
		UnitDef::new("Re",       Dimension::Temperature,     None,               PrefixGroup::Thermal, PrefixGroup::Thermal),
		UnitDef::new("Ro",       Dimension::Temperature,     None,               PrefixGroup::Thermal, PrefixGroup::Thermal),
		UnitDef::new("L",        Dimension::Temperature,     None,               PrefixGroup::Thermal, PrefixGroup::Thermal),
		UnitDef::new("W",        Dimension::Temperature,     None,               PrefixGroup::Thermal, PrefixGroup::Thermal),
		UnitDef::new("Da",       Dimension::Temperature,     None,               PrefixGroup::Thermal, PrefixGroup::Thermal),
		//
    UnitDef::new("%",        Dimension::Percent,         None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("fr",       Dimension::Fraction,        None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("deg",      Dimension::Degree,          None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("\u{00B0}", Dimension::Degree,          None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("rad",      Dimension::Radian,          None,               PrefixGroup::None, PrefixGroup::None),
    UnitDef::new("D",        Dimension::Dimension,       None,               PrefixGroup::None, PrefixGroup::None),
];

pub static UNIT_PROPS: &[(&'static str, UnitProps)] = &[
    // --- Температура (база Кельвин) ---
    ("C",   UnitProps { scale: 1.0,           offset: 273.15,             mode: CalcMode::Linear}),
    ("F",   UnitProps { scale: 5.0 / 9.0,     offset: 255.37222222222222, mode: CalcMode::Linear}),
    ("Ra",  UnitProps { scale: 5.0 / 9.0,     offset: 0.0,                mode: CalcMode::Linear}),
    ("N",   UnitProps { scale: 100.0 / 33.0,  offset: 273.15,             mode: CalcMode::Linear}),
    ("D",   UnitProps { scale: -2.0 / 3.0,    offset: 373.15,             mode: CalcMode::Linear}),
    ("Re",  UnitProps { scale: 1.25,          offset: 273.15,             mode: CalcMode::Linear}),
    ("Ro",  UnitProps { scale: 40.0 / 21.0,   offset: 258.864286,         mode: CalcMode::Linear}),
    ("L",   UnitProps { scale: 1.0,           offset: 20.15,              mode: CalcMode::Linear}),
    ("W",   UnitProps { scale: 24.857191,     offset: 542.15,             mode: CalcMode::Linear}),
		("Da",  UnitProps { scale: 373.15,        offset: 273.15,             mode: CalcMode::Exponential }),

    // --- Масса (база грамм) ---
    ("t",   UnitProps { scale: 1e6,  offset: 0.0, mode: CalcMode::Linear}),

    // --- Длина (база метр) ---
    ("ft",  UnitProps { scale: 0.3048,        offset: 0.0, mode: CalcMode::Linear}),
    ("mi",  UnitProps { scale: 1609.344,      offset: 0.0, mode: CalcMode::Linear}),
    ("in",  UnitProps { scale: 0.0254,        offset: 0.0, mode: CalcMode::Linear}),
    ("pt",  UnitProps { scale: 0.000352778,   offset: 0.0, mode: CalcMode::Linear}),
    ("pc",  UnitProps { scale: 0.004233333,   offset: 0.0, mode: CalcMode::Linear}),

    // --- Время (база секунда) ---
    ("min",   UnitProps { scale: 60.0,        offset: 0.0, mode: CalcMode::Linear}),
    ("hour",  UnitProps { scale: 3600.0,      offset: 0.0, mode: CalcMode::Linear}),
    ("day",   UnitProps { scale: 86400.0,     offset: 0.0, mode: CalcMode::Linear}),
    ("week",  UnitProps { scale: 604800.0,    offset: 0.0, mode: CalcMode::Linear}),
    ("month", UnitProps { scale: 2629746.0,   offset: 0.0, mode: CalcMode::Linear}),
    ("year",  UnitProps { scale: 31556952.0,  offset: 0.0, mode: CalcMode::Linear}),

    // --- Скорость (база м/с) ---
    ("kn",    UnitProps { scale: 0.514444,    offset: 0.0, mode: CalcMode::Linear}),
    ("mi/h",  UnitProps { scale: 0.44704,     offset: 0.0, mode: CalcMode::Linear}),

    // --- Данные (база Байт) ---
    ("b",     UnitProps { scale: 0.125,       offset: 0.0, mode: CalcMode::Linear}), // bit
    ("bit/s", UnitProps { scale: 0.125,       offset: 0.0, mode: CalcMode::Linear}),

    // --- Углы (база Радиан) ---
    ("deg",         UnitProps { scale: 0.017453292519943295, offset: 0.0, mode: CalcMode::Linear}),
    ("\u{00B0}",    UnitProps { scale: 0.017453292519943295, offset: 0.0, mode: CalcMode::Linear}),

    // --- Прочее ---
    ("%",     UnitProps { scale: 0.01,        offset: 0.0, mode: CalcMode::Linear}),
];
