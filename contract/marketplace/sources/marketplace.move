module marketplace::marketplace {
    use iota::object::{Self, UID, ID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use iota::coin::{Self, Coin};
    use iota::iota::IOTA;
    use iota::event;
    use std::string::{Self, String};
    use iota::table::{Self, Table};
    use iota::dynamic_object_field as dof;

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

    public struct PriceUpdated has copy, drop {
        nft_id: ID,
        old_price: u64,
        new_price: u64,
    }

    // ============ Error Codes ============

    const E_INVALID_PRICE: u64 = 0;
    const E_NFT_NOT_LISTED: u64 = 1;
    const E_INSUFFICIENT_PAYMENT: u64 = 2;
    const E_CANNOT_BUY_OWN_NFT: u64 = 3;
    const E_NOT_SELLER: u64 = 4;

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

    /// List NFT lên marketplace - NFT sẽ được lưu trong dynamic object field
    public entry fun list_nft(
        marketplace: &mut Marketplace,
        nft: NFT,
        price: u64,
        ctx: &mut TxContext
    ) {
        assert!(price > 0, E_INVALID_PRICE);

        let nft_id = object::id(&nft);
        let seller = tx_context::sender(ctx);

        let listing = Listing {
            nft_id,
            price,
            seller,
        };

        // Thêm listing vào table
        table::add(&mut marketplace.listings, nft_id, listing);

        // Lưu NFT vào dynamic object field của marketplace
        dof::add(&mut marketplace.id, nft_id, nft);

        event::emit(NFTListed {
            nft_id,
            seller,
            price,
        });
    }

    /// Mua NFT từ marketplace
    public entry fun buy_nft(
        marketplace: &mut Marketplace,
        nft_id: ID,
        mut payment: Coin<IOTA>,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&marketplace.listings, nft_id), E_NFT_NOT_LISTED);

        let listing = table::remove(&mut marketplace.listings, nft_id);
        let buyer = tx_context::sender(ctx);

        assert!(coin::value(&payment) >= listing.price, E_INSUFFICIENT_PAYMENT);
        assert!(buyer != listing.seller, E_CANNOT_BUY_OWN_NFT);

        // Lấy NFT từ dynamic object field
        let nft = dof::remove<ID, NFT>(&mut marketplace.id, nft_id);

        // Tách tiền để trả cho seller
        let payment_coin = coin::split(&mut payment, listing.price, ctx);
        transfer::public_transfer(payment_coin, listing.seller);

        // Hoàn lại tiền thừa cho buyer (nếu có)
        if (coin::value(&payment) > 0) {
            transfer::public_transfer(payment, buyer);
        } else {
            coin::destroy_zero(payment);
        };

        // Transfer NFT cho buyer
        transfer::public_transfer(nft, buyer);

        event::emit(NFTSold {
            nft_id,
            seller: listing.seller,
            buyer,
            price: listing.price,
        });
    }

    /// Unlist NFT khỏi marketplace và trả lại cho seller
    public entry fun unlist_nft(
        marketplace: &mut Marketplace,
        nft_id: ID,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&marketplace.listings, nft_id), E_NFT_NOT_LISTED);

        let listing = table::borrow(&marketplace.listings, nft_id);
        let sender = tx_context::sender(ctx);

        assert!(listing.seller == sender, E_NOT_SELLER);

        // Remove listing
        let listing = table::remove(&mut marketplace.listings, nft_id);

        // Lấy NFT từ dynamic object field
        let nft = dof::remove<ID, NFT>(&mut marketplace.id, nft_id);

        // Trả NFT về cho seller
        transfer::public_transfer(nft, listing.seller);

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
        assert!(table::contains(&marketplace.listings, nft_id), E_NFT_NOT_LISTED);
        assert!(new_price > 0, E_INVALID_PRICE);

        let listing = table::borrow_mut(&mut marketplace.listings, nft_id);
        let sender = tx_context::sender(ctx);

        assert!(listing.seller == sender, E_NOT_SELLER);

        let old_price = listing.price;
        listing.price = new_price;

        event::emit(PriceUpdated {
            nft_id,
            old_price,
            new_price,
        });
    }

    // ============ View Functions ============

    /// Lấy thông tin NFT từ marketplace (nếu đang được list)
    public fun get_listed_nft_info(marketplace: &Marketplace, nft_id: ID): (String, String, String, address, u64, address) {
        assert!(table::contains(&marketplace.listings, nft_id), E_NFT_NOT_LISTED);
        
        let nft = dof::borrow<ID, NFT>(&marketplace.id, nft_id);
        let listing = table::borrow(&marketplace.listings, nft_id);
        
        (nft.name, nft.description, nft.url, nft.creator, listing.price, listing.seller)
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

    /// Lấy thông tin listing
    public fun get_listing(marketplace: &Marketplace, nft_id: ID): (u64, address) {
        let listing = table::borrow(&marketplace.listings, nft_id);
        (listing.price, listing.seller)
    }

    // ============ Test Functions ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}