import secrets


def generate_serial_code() -> str:
    part1 = secrets.token_hex(2).upper()
    part2 = secrets.token_hex(2).upper()
    return f"QM-{part1}-{part2}"
