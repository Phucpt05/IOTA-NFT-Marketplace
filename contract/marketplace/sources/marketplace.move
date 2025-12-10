module marketplace::marketplace {
    use iota::object::{Self, UID, ID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use iota::coin::{Self, Coin};
    use iota::iota::IOTA;
    use iota::event;
    use std::string::{Self, String};
    use iota::table::{Self, Table};
    use iota::transfer::share_object;

    // ============ Structs ============

    /// NFT object
    public struct NFT has key, store {
        id: UID,
        name: String,
        description: String,
        url: String,
        creator: address,
    }

    /// Marketplace object - shared object
    public struct Marketplace has key {
        id: UID,
        listings: Table<ID, Listing>,
    }

    /// Listing info cho mỗi NFT
    public struct Listing has store, drop {
        nft_id: ID,
        price: u64,
        seller: address,
    }

    // ============ Events ============

    public struct NFTMinted has copy, drop {
        nft_id: ID,
        creator: address,
        name: String,
        description: String,
        url: String,
    }

    public struct NFTListed has copy, drop {
        nft_id: ID,
        seller: address,
        price: u64,
    }

    public struct NFTSold has copy, drop {
        nft_id: ID,
        seller: address,
        buyer: address,
        price: u64,
    }

    public struct NFTUnlisted has copy, drop {
        nft_id: ID,
        seller: address,
    }

    // ============ Init Function ============

    /// Khởi tạo marketplace khi deploy module
    fun init(ctx: &mut TxContext) {
        let marketplace = Marketplace {
            id: object::new(ctx),
            listings: table::new(ctx),
        };
        transfer::share_object(marketplace);
    }

    // ============ Public Functions ============

    /// Mint một NFT mới
    public entry fun mint_nft(
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        let nft = NFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            url: string::utf8(url),
            creator: sender,
        };

        let nft_id = object::id(&nft);

        event::emit(NFTMinted {
            nft_id,
            creator: sender,
            name: nft.name,
            description: nft.description,
            url: nft.url,
        });

        transfer::public_transfer(nft, sender);
    }

    /// List NFT lên marketplace
    public entry fun list_nft(
        marketplace: &mut Marketplace,
        nft: NFT,
        price: u64,
        ctx: &mut TxContext
    ) {
        assert!(price > 0, 0); // Price phải > 0

        let nft_id = object::id(&nft);
        let seller = tx_context::sender(ctx);

        let listing = Listing {
            nft_id,
            price,
            seller,
        };

        table::add(&mut marketplace.listings, nft_id, listing);

        event::emit(NFTListed {
            nft_id,
            seller,
            price,
        });

        // Transfer NFT vào marketplace (hold bởi shared object)
        // transfer::share_object(nft);
    }

    /// Mua NFT từ marketplace
    public entry fun buy_nft(
        marketplace: &mut Marketplace,
        nft_id: ID,
        payment: Coin<IOTA>,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&marketplace.listings, nft_id), 1); // NFT phải được list

        let listing = table::remove(&mut marketplace.listings, nft_id);
        let buyer = tx_context::sender(ctx);

        assert!(coin::value(&payment) >= listing.price, 2); // Payment phải đủ
        assert!(buyer != listing.seller, 3); // Không thể tự mua NFT của mình

        // Transfer tiền cho seller
        transfer::public_transfer(payment, listing.seller);

        event::emit(NFTSold {
            nft_id,
            seller: listing.seller,
            buyer,
            price: listing.price,
        });

        // Note: NFT sẽ được transfer thủ công sau khi mua
        // Vì Move không cho phép lấy object từ module address
        // Frontend cần gọi transfer_nft_to_buyer sau khi mua
    }

    /// Unlist NFT khỏi marketplace
    public entry fun unlist_nft(
        marketplace: &mut Marketplace,
        nft_id: ID,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&marketplace.listings, nft_id), 4); // NFT phải được list

        let listing = table::borrow(&marketplace.listings, nft_id);
        let sender = tx_context::sender(ctx);

        assert!(listing.seller == sender, 5); // Chỉ seller mới unlist được

        table::remove(&mut marketplace.listings, nft_id);

        event::emit(NFTUnlisted {
            nft_id,
            seller: sender,
        });
    }

    /// Update giá của NFT đã list
    public entry fun update_price(
        marketplace: &mut Marketplace,
        nft_id: ID,
        new_price: u64,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&marketplace.listings, nft_id), 4);
        assert!(new_price > 0, 0);

        let listing = table::borrow_mut(&mut marketplace.listings, nft_id);
        let sender = tx_context::sender(ctx);

        assert!(listing.seller == sender, 5);

        listing.price = new_price;
    }

    // ============ View Functions ============

    /// Lấy thông tin NFT
    public fun get_nft_info(nft: &NFT): (String, String, String, address) {
        (nft.name, nft.description, nft.url, nft.creator)
    }

    /// Kiểm tra NFT có đang được list không
    public fun is_listed(marketplace: &Marketplace, nft_id: ID): bool {
        table::contains(&marketplace.listings, nft_id)
    }

    /// Lấy giá của NFT đang list
    public fun get_price(marketplace: &Marketplace, nft_id: ID): u64 {
        let listing = table::borrow(&marketplace.listings, nft_id);
        listing.price
    }

    /// Lấy seller của NFT đang list
    public fun get_seller(marketplace: &Marketplace, nft_id: ID): address {
        let listing = table::borrow(&marketplace.listings, nft_id);
        listing.seller
    }

    // ============ Test Functions ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}