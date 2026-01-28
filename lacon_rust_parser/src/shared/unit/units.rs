use super::definition::{PrefixGroup, UnitDef};
use super::dimensions::Dimension;
use super::props::{CalcMode, Formula, UnitProps};

pub static UNITS: &[UnitDef] = units_array![
    []
    UnitDef::new(
        "Hz",
        Dimension::Frequency,
        None,
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps {
            formula: Formula::Complex {
                num: &[], // Пусто, так как в числителе единица
                den: &[Dimension::Time],
            },
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "g",
        Dimension::Mass,
        None,
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps::DEFAULT,
    ),
    UnitDef::new(
        "m",
        Dimension::Length,
        None,
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps::DEFAULT,
    ),
    UnitDef::new(
        "s",
        Dimension::Time,
        None,
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps::DEFAULT,
    ),
    UnitDef::new(
        "mol",
        Dimension::Amount,
        None,
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps::DEFAULT,
    ),
    //
    UnitDef::new(
        "g/m2",
        Dimension::AreaDensity,
        Some(("g", "m2")),
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps {
            formula: Formula::Complex {
                num: &[Dimension::Mass],
                den: &[Dimension::Length, Dimension::Length],
            },
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "g/m3",
        Dimension::Density,
        Some(("g", "m3")),
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps {
            formula: Formula::Complex {
                num: &[Dimension::Mass],
                den: &[Dimension::Length, Dimension::Length, Dimension::Length],
            },
            ..UnitProps::DEFAULT
        },
    ),
    //
    UnitDef::new(
        "m/s",
        Dimension::Velocity,
        Some(("m", "s")),
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps {
            formula: Formula::Complex {
                num: &[Dimension::Length],
                den: &[Dimension::Time],
            },
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "m/s2",
        Dimension::Acceleration,
        Some(("m", "s2")),
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps {
            formula: Formula::Complex {
                num: &[Dimension::Length],
                den: &[Dimension::Time, Dimension::Time],
            },
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "m/s3",
        Dimension::Jerk,
        Some(("m", "s3")),
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps {
            formula: Formula::Complex {
                num: &[Dimension::Length],
                den: &[Dimension::Time, Dimension::Time, Dimension::Time],
            },
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "m/s4",
        Dimension::Snap,
        Some(("m", "s4")),
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps {
            formula: Formula::Complex {
                num: &[Dimension::Length],
                den: &[
                    Dimension::Time,
                    Dimension::Time,
                    Dimension::Time,
                    Dimension::Time,
                ],
            },
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "m/s5",
        Dimension::Crackle,
        Some(("m", "s5")),
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps {
            formula: Formula::Complex {
                num: &[Dimension::Length],
                den: &[
                    Dimension::Time,
                    Dimension::Time,
                    Dimension::Time,
                    Dimension::Time,
                    Dimension::Time,
                ],
            },
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "m/s6",
        Dimension::Pop,
        Some(("m", "s6")),
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps {
            formula: Formula::Complex {
                num: &[Dimension::Length],
                den: &[
                    Dimension::Time,
                    Dimension::Time,
                    Dimension::Time,
                    Dimension::Time,
                    Dimension::Time,
                    Dimension::Time,
                ],
            },
            ..UnitProps::DEFAULT
        },
    ),
    //
    UnitDef::new(
        "b",
        Dimension::Size,
        None,
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps {
            scale: 0.125,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "B",
        Dimension::Size,
        None,
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps::DEFAULT,
    ),
    UnitDef::new(
        "bit/s",
        Dimension::BitRate,
        Some(("bit", "s")),
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps {
            scale: 0.125,
            formula: Formula::Complex {
                num: &[Dimension::Size],
                den: &[Dimension::Time],
            },
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "B/s",
        Dimension::BitRate,
        Some(("B", "s")),
        PrefixGroup::SI,
        PrefixGroup::SI,
        UnitProps {
            formula: Formula::Complex {
                num: &[Dimension::Size],
                den: &[Dimension::Time],
            },
            ..UnitProps::DEFAULT
        },
    ),
    //
    UnitDef::new(
        "t",
        Dimension::Mass,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 1e6,
            ..UnitProps::DEFAULT
        },
    ),
    //
    UnitDef::new(
        "ft",
        Dimension::Length,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 0.3048,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "mi",
        Dimension::Length,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 1609.344,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "in",
        Dimension::Length,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 0.0254,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "em",
        Dimension::Length,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps::DEFAULT,
    ),
    UnitDef::new(
        "rem",
        Dimension::Length,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps::DEFAULT,
    ),
    UnitDef::new(
        "pt",
        Dimension::Length,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 0.000352778,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "pc",
        Dimension::Length,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 0.004233333,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "px",
        Dimension::Length,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps::DEFAULT,
    ),
    //
    UnitDef::new(
        "min",
        Dimension::Time,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 60.0,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "hour",
        Dimension::Time,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 3600.0,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "day",
        Dimension::Time,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 86400.0,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "week",
        Dimension::Time,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 604800.0,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "month",
        Dimension::Time,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 2629746.0,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "year",
        Dimension::Time,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 31556952.0,
            ..UnitProps::DEFAULT
        },
    ),
    //
    UnitDef::new(
        "ft/s",
        Dimension::Velocity,
        Some(("m", "s")),
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 0.3048,
            formula: Formula::Complex {
                num: &[Dimension::Length],
                den: &[Dimension::Time],
            },
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "mi/h",
        Dimension::Velocity,
        Some(("m", "s")),
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 0.44704,
            formula: Formula::Complex {
                num: &[Dimension::Length],
                den: &[Dimension::Time],
            },
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "kn",
        Dimension::Velocity,
        Some(("m", "s")),
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 0.514444,
            formula: Formula::Complex {
                num: &[Dimension::Length],
                den: &[Dimension::Time],
            },
            ..UnitProps::DEFAULT
        },
    ),
    //
    UnitDef::new(
        "K",
        Dimension::Temperature,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps::DEFAULT,
    ),
    @multi ["deg", "\u{00B0}"] "C", Dimension::Temperature, (PrefixGroup::Thermal, PrefixGroup::Thermal), UnitProps {
        offset: 273.15,
        ..UnitProps::DEFAULT
    },
    @multi ["deg", "\u{00B0}"] "F", Dimension::Temperature, (PrefixGroup::Thermal, PrefixGroup::Thermal), UnitProps {
        scale: 5.0 / 9.0,
        offset: 255.37222222222222,
        ..UnitProps::DEFAULT
    },
    @multi ["deg", "\u{00B0}"] "Ra", Dimension::Temperature, (PrefixGroup::Thermal, PrefixGroup::Thermal), UnitProps {
        scale: 5.0 / 9.0,
        ..UnitProps::DEFAULT
    },
    @multi ["deg", "\u{00B0}"] "N", Dimension::Temperature, (PrefixGroup::Thermal, PrefixGroup::Thermal), UnitProps {
        scale: 100.0 / 33.0,
        offset: 273.15,
        ..UnitProps::DEFAULT
    },
    @multi ["deg", "\u{00B0}"] "D", Dimension::Temperature, (PrefixGroup::Thermal, PrefixGroup::Thermal), UnitProps {
        scale: -2.0 / 3.0,
        offset: 373.15,
        ..UnitProps::DEFAULT
    },
    @multi ["deg", "\u{00B0}"] "Re", Dimension::Temperature, (PrefixGroup::Thermal, PrefixGroup::Thermal), UnitProps {
        scale: 1.25,
        offset: 273.15,
        ..UnitProps::DEFAULT
    },
    @multi ["deg", "\u{00B0}"] "Ro", Dimension::Temperature, (PrefixGroup::Thermal, PrefixGroup::Thermal), UnitProps {
        scale: 40.0 / 21.0,
        offset: 258.864286,
        ..UnitProps::DEFAULT
    },
    @multi ["deg", "\u{00B0}"] "L", Dimension::Temperature, (PrefixGroup::Thermal, PrefixGroup::Thermal), UnitProps {
        offset: 20.15,
        ..UnitProps::DEFAULT
    },
    @multi ["deg", "\u{00B0}"] "W", Dimension::Temperature, (PrefixGroup::Thermal, PrefixGroup::Thermal), UnitProps {
        scale: 24.857191,
        offset: 542.15,
        ..UnitProps::DEFAULT
    },
    @multi ["deg", "\u{00B0}"] "Da", Dimension::Temperature, (PrefixGroup::Thermal, PrefixGroup::Thermal), UnitProps {
        scale: 373.15,
        offset: 273.15,
        mode: CalcMode::Exponential,
        ..UnitProps::DEFAULT
    },
    //
    UnitDef::new(
        "%",
        Dimension::Percent,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 0.01,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "fr",
        Dimension::Fraction,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps::DEFAULT,
    ),
    UnitDef::new(
        "deg",
        Dimension::Degree,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 0.017453292519943295,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "\u{00B0}",
        Dimension::Degree,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps {
            scale: 0.017453292519943295,
            ..UnitProps::DEFAULT
        },
    ),
    UnitDef::new(
        "rad",
        Dimension::Radian,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps::DEFAULT,
    ),
    UnitDef::new(
        "D",
        Dimension::Dimension,
        None,
        PrefixGroup::None,
        PrefixGroup::None,
        UnitProps::DEFAULT,
    ),
];

#[test]
fn test_degc_units_exist() {
    let degc = UNITS.iter().find(|u| u.symbol == "degC");
    let degree_c = UNITS.iter().find(|u| u.symbol == "\u{00B0}C");

    assert!(degc.is_some(), "degC unit not found");
    assert!(degree_c.is_some(), "°C unit not found");

    let degc = degc.unwrap();
    let degree_c = degree_c.unwrap();

    // Проверяем, что оба - Temperature
    assert!(matches!(degc.dimension, Dimension::Temperature));
    assert!(matches!(degree_c.dimension, Dimension::Temperature));

    assert_eq!(degc.props.scale, degree_c.props.scale);
    assert_eq!(degc.props.offset, degree_c.props.offset);

    println!("✓ degC symbol: {}", degc.symbol);
    println!("✓ °C symbol: {}", degree_c.symbol);
}
