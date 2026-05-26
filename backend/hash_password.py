import sys

from routers.auth import hash_password


def main():
    if len(sys.argv) != 2:
        print("Usage: python backend/hash_password.py <password>")
        raise SystemExit(1)

    print(hash_password(sys.argv[1]))


if __name__ == "__main__":
    main()
